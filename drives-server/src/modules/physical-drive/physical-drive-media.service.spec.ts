import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PhysicalDriveMediaService } from './physical-drive-media.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import {
  PhysicalDriveMedia,
  PhysicalDriveMediaType,
} from './entities/physical-drive-media.entity';
import { MediaService } from '../media/media.service';

const file = {
  buffer: Buffer.from('attachment'),
  mimetype: 'image/png',
  originalname: 'photo.png',
  size: 10,
} as Express.Multer.File;

describe('PhysicalDriveMediaService', () => {
  let service: PhysicalDriveMediaService;
  let driveModel: { findByPk: ReturnType<typeof vi.fn> };
  let mediaAttachmentModel: {
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };
  let mediaService: {
    prepareUpload: ReturnType<typeof vi.fn>;
    findOrCreateMedia: ReturnType<typeof vi.fn>;
  };
  let sequelize: { transaction: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    driveModel = { findByPk: vi.fn().mockResolvedValue({ id: 'drive-1' }) };
    mediaAttachmentModel = {
      findAll: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'attachment-1' }),
      update: vi.fn().mockResolvedValue([1]),
      destroy: vi.fn().mockResolvedValue(1),
    };
    mediaService = {
      prepareUpload: vi.fn().mockResolvedValue({
        fileId: 'hash-1',
        mediaType: 'IMAGE',
        fileName: 'photo.png',
        mimeType: 'image/png',
        fileSize: 10,
        metadata: null,
      }),
      findOrCreateMedia: vi.fn().mockResolvedValue({
        media: { id: 'media-1' },
        isNew: true,
      }),
    };
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    sequelize = {
      transaction: vi.fn((callback: (tx: unknown) => unknown) =>
        callback(transaction),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalDriveMediaService,
        { provide: getModelToken(PhysicalDrive), useValue: driveModel },
        {
          provide: getModelToken(PhysicalDriveMedia),
          useValue: mediaAttachmentModel,
        },
        { provide: MediaService, useValue: mediaService },
        { provide: getConnectionToken(), useValue: sequelize },
      ],
    }).compile();

    service = module.get(PhysicalDriveMediaService);
  });

  it('attaches files with per-file metadata', async () => {
    const finalAttachments = [{ id: 'attachment-1' }];
    mediaAttachmentModel.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(finalAttachments);

    const result = await service.attachFiles(
      'drive-1',
      [file],
      [
        {
          attachmentType: PhysicalDriveMediaType.PICTURE,
          notes: 'Front view',
          isPrimary: true,
        },
      ],
    );

    expect(result).toBe(finalAttachments);
    expect(mediaAttachmentModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        physicalDriveId: 'drive-1',
        mediaId: 'media-1',
        attachmentType: PhysicalDriveMediaType.PICTURE,
        notes: 'Front view',
        isPrimary: false,
        sortOrder: 0,
      }),
      expect.any(Object),
    );
    expect(mediaAttachmentModel.update).toHaveBeenCalledWith(
      { isPrimary: true },
      expect.objectContaining({
        where: { id: 'attachment-1', physicalDriveId: 'drive-1' },
      }),
    );
  });

  it('clears existing primary flags when a new primary is attached', async () => {
    mediaAttachmentModel.findAll.mockResolvedValue([]);

    await service.attachFiles('drive-1', [file], [{ isPrimary: true }]);

    expect(mediaAttachmentModel.update).toHaveBeenCalledWith(
      { isPrimary: false },
      expect.objectContaining({
        where: { physicalDriveId: 'drive-1' },
      }),
    );
  });

  it('applies updates and removals through one manageMedia call', async () => {
    const first = {
      id: 'a-1',
      mediaId: 'm-1',
      attachmentType: PhysicalDriveMediaType.OTHER,
      isPrimary: true,
      sortOrder: 0,
      notes: 'old',
      update: vi.fn().mockResolvedValue(undefined),
    };
    const second = {
      id: 'a-2',
      mediaId: 'm-2',
      attachmentType: PhysicalDriveMediaType.DOCUMENT,
      isPrimary: false,
      sortOrder: 1,
      notes: null,
    };
    mediaAttachmentModel.findAll
      .mockResolvedValueOnce([first, second])
      .mockResolvedValueOnce([first]);

    await service.manageMedia('drive-1', {
      update: [
        {
          attachmentId: 'a-1',
          notes: 'new note',
          isPrimary: false,
        },
      ],
      remove: ['a-2'],
    });

    expect(first.update).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'new note' }),
      expect.any(Object),
    );
    expect(mediaAttachmentModel.destroy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ['a-2'], physicalDriveId: 'drive-1' },
      }),
    );
    expect(mediaAttachmentModel.update).toHaveBeenCalledWith(
      { isPrimary: false },
      expect.objectContaining({
        where: { physicalDriveId: 'drive-1' },
      }),
    );
  });

  it('rejects an empty file list', async () => {
    await expect(service.attachFiles('drive-1', [])).rejects.toThrow(
      /At least one file is required/,
    );
  });

  it('throws when the drive does not exist', async () => {
    driveModel.findByPk.mockResolvedValue(null);

    await expect(service.findForDrive('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('detaches an attachment owned by the drive', async () => {
    mediaAttachmentModel.findAll.mockResolvedValue([{ id: 'a-1' }]);

    await service.detach('drive-1', 'a-1');

    expect(mediaAttachmentModel.destroy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ['a-1'], physicalDriveId: 'drive-1' },
      }),
    );
  });

  it('rejects detaching an attachment from another drive', async () => {
    mediaAttachmentModel.findAll.mockResolvedValue([]);

    await expect(service.detach('drive-1', 'a-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
