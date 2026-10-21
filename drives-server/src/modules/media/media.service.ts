import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction, UniqueConstraintError } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { PaginationService } from '../pagination/pagination.service';
import { PaginationQueryDto } from '../pagination/dto/pagination-query.dto';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';
import { ContentStoreService } from '../content-store/services/content-store.service';
import { Media, MediaType } from './entities/media.entity';

export interface PreparedMediaUpload {
  fileId: string;
  mediaType: MediaType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  metadata: Record<string, unknown> | null;
}

export interface MediaUploadOptions {
  mediaType?: MediaType;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media)
    private readonly mediaModel: typeof Media,
    private readonly paginationService: PaginationService,
    private readonly contentStore: ContentStoreService,
  ) {}

  async findAll(query?: PaginationQueryDto): Promise<PaginatedResponse<Media>> {
    return this.paginationService.paginate<Media>(this.mediaModel, query);
  }

  async findOne(id: string): Promise<Media | null> {
    return this.mediaModel.findByPk(id);
  }

  async findByFileId(fileId: string): Promise<Media | null> {
    return this.mediaModel.findOne({ where: { fileId } });
  }

  /**
   * Writes the bytes to the content store without touching the database. The
   * returned descriptor can be turned into a media row inside a caller-owned
   * transaction, keeping content I/O outside the DB transaction.
   */
  async prepareUpload(
    file: Express.Multer.File,
    options: MediaUploadOptions = {},
  ): Promise<PreparedMediaUpload> {
    const metadata = options.metadata ?? null;
    const { fileId } = await this.contentStore.upload(
      file.buffer,
      file.mimetype,
      {
        ...(metadata ?? {}),
        originalName: file.originalname,
      },
    );

    return {
      fileId,
      mediaType: options.mediaType ?? this.inferMediaType(file.mimetype),
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      metadata,
    };
  }

  /**
   * Finds or creates the media row for an already-stored content object.
   * Pass the caller's transaction when this must be atomic with attachments.
   */
  async findOrCreateMedia(
    upload: PreparedMediaUpload,
    transaction?: Transaction,
  ): Promise<{ media: Media; isNew: boolean }> {
    const existing = await this.mediaModel.findOne({
      where: { fileId: upload.fileId },
      transaction,
    });
    if (existing) {
      return { media: existing, isNew: false };
    }

    try {
      const media = await this.mediaModel.create(
        {
          fileId: upload.fileId,
          mediaType: upload.mediaType,
          fileName: upload.fileName,
          mimeType: upload.mimeType,
          fileSize: upload.fileSize,
          metadata: upload.metadata,
        },
        { transaction },
      );
      return { media, isNew: true };
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const raced = await this.mediaModel.findOne({
          where: { fileId: upload.fileId },
          transaction,
        });
        if (raced) return { media: raced, isNew: false };
      }
      throw error;
    }
  }

  /**
   * Stores the file in the content store and records the media row that tracks
   * it. Content is deduplicated by SHA-256, so uploading the same bytes twice
   * returns the existing media record.
   */
  async trackUpload(
    file: Express.Multer.File,
    options: MediaUploadOptions = {},
  ): Promise<{ media: Media; isNew: boolean }> {
    const upload = await this.prepareUpload(file, options);
    return this.findOrCreateMedia(upload);
  }

  async delete(id: string): Promise<boolean> {
    const media = await this.mediaModel.findByPk(id);
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    await media.destroy();
    return true;
  }

  private inferMediaType(mimetype: string): MediaType {
    if (mimetype.startsWith('image/')) return MediaType.IMAGE;
    if (mimetype.startsWith('video/')) return MediaType.VIDEO;
    return MediaType.DOCUMENT;
  }
}
