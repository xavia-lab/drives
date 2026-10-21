import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaService } from './media.service';
import { Media, MediaType } from './entities/media.entity';
import { ContentStoreService } from '../content-store/services/content-store.service';
import { PaginationService } from '../pagination/pagination.service';

const file = {
  buffer: Buffer.from('media-content'),
  mimetype: 'image/png',
  originalname: 'photo.png',
  size: 13,
} as Express.Multer.File;

describe('MediaService', () => {
  let service: MediaService;
  let mediaModel: {
    findAll: ReturnType<typeof vi.fn>;
    findByPk: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let paginationService: { paginate: ReturnType<typeof vi.fn> };
  let contentStore: { upload: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mediaModel = {
      findAll: vi.fn(),
      findByPk: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
    };
    paginationService = { paginate: vi.fn() };
    contentStore = { upload: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getModelToken(Media), useValue: mediaModel },
        { provide: PaginationService, useValue: paginationService },
        { provide: ContentStoreService, useValue: contentStore },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  it('delegates paginated reads to the pagination service', async () => {
    const expected = { data: [], meta: {} };
    paginationService.paginate.mockResolvedValue(expected);

    await expect(service.findAll({ pageNumber: 1 })).resolves.toBe(expected);
    expect(paginationService.paginate).toHaveBeenCalledWith(mediaModel, {
      pageNumber: 1,
    });
  });

  it('tracks a new upload and infers the media type', async () => {
    const created = { id: 'media-1', fileId: 'hash-1' };
    contentStore.upload.mockResolvedValue({ fileId: 'hash-1', isNew: true });
    mediaModel.findOne.mockResolvedValue(null);
    mediaModel.create.mockResolvedValue(created);

    const result = await service.trackUpload(file, {
      metadata: { caption: 'Front view' },
    });

    expect(result).toEqual({ media: created, isNew: true });
    expect(mediaModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'hash-1',
        mediaType: MediaType.IMAGE,
        fileName: 'photo.png',
        mimeType: 'image/png',
        fileSize: 13,
        metadata: { caption: 'Front view' },
      }),
      expect.any(Object),
    );
  });

  it('returns the existing media record for duplicate content', async () => {
    const existing = { id: 'media-1', fileId: 'hash-1' };
    contentStore.upload.mockResolvedValue({ fileId: 'hash-1', isNew: false });
    mediaModel.findOne.mockResolvedValue(existing);

    const result = await service.trackUpload(file);

    expect(result).toEqual({ media: existing, isNew: false });
    expect(mediaModel.create).not.toHaveBeenCalled();
  });

  it('uses a supplied media type instead of inferring one', async () => {
    contentStore.upload.mockResolvedValue({ fileId: 'hash-1', isNew: true });
    mediaModel.findOne.mockResolvedValue(null);
    mediaModel.create.mockResolvedValue({ id: 'media-1' });

    await service.trackUpload(file, { mediaType: MediaType.CERTIFICATE });

    expect(mediaModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ mediaType: MediaType.CERTIFICATE }),
      expect.any(Object),
    );
  });

  it('soft-deletes an existing media record', async () => {
    const destroy = vi.fn().mockResolvedValue(undefined);
    mediaModel.findByPk.mockResolvedValue({ id: 'media-1', destroy });

    await expect(service.delete('media-1')).resolves.toBe(true);
    expect(destroy).toHaveBeenCalled();
  });

  it('throws when deleting a missing media record', async () => {
    mediaModel.findByPk.mockResolvedValue(null);

    await expect(service.delete('missing')).rejects.toThrow(
      /Media with ID missing not found/,
    );
  });
});
