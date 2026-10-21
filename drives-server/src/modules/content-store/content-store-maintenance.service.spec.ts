import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentStoreMaintenanceService } from './content-store-maintenance.service';
import { CONTENT_STORE_PROVIDER } from './interfaces/content-store-provider.interface';
import type { ContentStoreProvider } from './interfaces/content-store-provider.interface';
import { TaskRunService } from '../tasks/task-run.service';

describe('ContentStoreMaintenanceService', () => {
  const config = {
    get: vi.fn((_key: string, fallback: unknown) => fallback),
  };

  const build = async (
    provider: Partial<ContentStoreProvider>,
  ): Promise<ContentStoreMaintenanceService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentStoreMaintenanceService,
        { provide: CONTENT_STORE_PROVIDER, useValue: provider },
        { provide: ConfigService, useValue: config },
        {
          provide: TaskRunService,
          useValue: {
            run: vi.fn((_key: string, _trigger: string, work: () => unknown) =>
              work(),
            ),
          },
        },
      ],
    }).compile();

    return module.get(ContentStoreMaintenanceService);
  };

  beforeEach(() => {
    config.get.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sweeps stale uploads on startup', async () => {
    const cleanupIncompleteUploads = vi.fn().mockResolvedValue(2);
    const service = await build({ cleanupIncompleteUploads });
    config.get.mockReturnValue({
      root: '/tmp/store',
      tmpMaxAgeMs: 60_000,
      cleanupIntervalMs: 0,
    });

    await service.onModuleInit();

    expect(cleanupIncompleteUploads).toHaveBeenCalledWith(60_000);
    service.onModuleDestroy();
  });

  it('runs periodic cleanup and stops on destroy', async () => {
    vi.useFakeTimers();
    const cleanupIncompleteUploads = vi.fn().mockResolvedValue(0);
    const service = await build({ cleanupIncompleteUploads });
    config.get.mockReturnValue({
      root: '/tmp/store',
      tmpMaxAgeMs: 30_000,
      cleanupIntervalMs: 1_000,
    });

    await service.onModuleInit();
    expect(cleanupIncompleteUploads).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(cleanupIncompleteUploads).toHaveBeenCalledTimes(2);

    service.onModuleDestroy();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(cleanupIncompleteUploads).toHaveBeenCalledTimes(2);
  });

  it('does nothing for providers without a local staging area', async () => {
    const service = await build({});

    await service.onModuleInit();

    expect(config.get).not.toHaveBeenCalled();
    service.onModuleDestroy();
  });
});
