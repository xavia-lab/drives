import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentStoreGcService } from './content-store-gc.service';
import { ContentStoreService } from './services/content-store.service';
import { Media } from '../media/entities/media.entity';
import { TaskRunService } from '../tasks/task-run.service';

describe('ContentStoreGcService', () => {
  let service: ContentStoreGcService;
  let contentStore: {
    listContentObjects: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mediaModel: { findAll: ReturnType<typeof vi.fn> };
  let config: { get: ReturnType<typeof vi.fn> };
  let sequelize: {
    getDialect: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    contentStore = {
      listContentObjects: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    mediaModel = {
      findAll: vi.fn().mockResolvedValue([]),
    };
    config = {
      get: vi.fn((key: string, fallback: unknown) => {
        const values: Record<string, unknown> = {
          'contentStore.gc.enabled': true,
          'contentStore.gc.graceMs': 86_400_000,
          'contentStore.gc.batchSize': 10,
        };
        return values[key] ?? fallback;
      }),
    };
    sequelize = {
      getDialect: vi.fn(() => 'sqlite'),
      transaction: vi.fn(),
    };

    const taskRunService = {
      run: vi.fn((_key: string, _trigger: string, work: () => unknown) =>
        work(),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentStoreGcService,
        { provide: TaskRunService, useValue: taskRunService },
        { provide: ContentStoreService, useValue: contentStore },
        { provide: getModelToken(Media), useValue: mediaModel },
        { provide: ConfigService, useValue: config },
        { provide: getConnectionToken(), useValue: sequelize },
      ],
    }).compile();

    service = module.get(ContentStoreGcService);
  });

  it('deletes only unreferenced objects older than the grace period', async () => {
    const now = Date.now();
    contentStore.listContentObjects.mockResolvedValue([
      { fileId: 'old-orphan', lastModified: new Date(now - 2 * 86_400_000) },
      {
        fileId: 'old-referenced',
        lastModified: new Date(now - 2 * 86_400_000),
      },
      { fileId: 'fresh-orphan', lastModified: new Date(now - 1_000) },
      { fileId: 'unknown-age', lastModified: null },
    ]);
    mediaModel.findAll.mockResolvedValue([{ fileId: 'old-referenced' }]);

    const deleted = await service.runGc();

    expect(deleted).toBe(1);
    expect(contentStore.delete).toHaveBeenCalledWith('old-orphan');
    expect(contentStore.delete).not.toHaveBeenCalledWith('old-referenced');
    expect(contentStore.delete).not.toHaveBeenCalledWith('fresh-orphan');
    expect(contentStore.delete).not.toHaveBeenCalledWith('unknown-age');
  });

  it('does nothing when GC is disabled', async () => {
    config.get.mockImplementation((key: string, fallback: unknown) =>
      key === 'contentStore.gc.enabled' ? false : fallback,
    );

    const deleted = await service.runGc();

    expect(deleted).toBeNull();
    expect(contentStore.listContentObjects).not.toHaveBeenCalled();
  });

  it('logs and swallows storage listing failures', async () => {
    contentStore.listContentObjects.mockRejectedValue(
      new Error('storage down'),
    );

    const deleted = await service.runGc();

    expect(deleted).toBeNull();
  });
});
