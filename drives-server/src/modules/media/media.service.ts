import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PaginationService } from '../pagination/pagination.service';
import { PaginationQueryDto } from '../pagination/dto/pagination-query.dto';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';
import { ContentStoreService } from '../content-store/services/content-store.service';
import { Media, MediaType } from './entities/media.entity';

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
   * Stores the file in the content store and records the media row that tracks
   * it. Content is deduplicated by SHA-256, so uploading the same bytes twice
   * returns the existing media record.
   */
  async trackUpload(
    file: Express.Multer.File,
    options: MediaUploadOptions = {},
  ): Promise<{ media: Media; isNew: boolean }> {
    const { fileId } = await this.contentStore.upload(
      file.buffer,
      file.mimetype,
      {
        ...options.metadata,
        originalName: file.originalname,
      },
    );

    const existing = await this.findByFileId(fileId);
    if (existing) {
      return { media: existing, isNew: false };
    }

    const media = await this.mediaModel.create({
      fileId,
      mediaType: options.mediaType ?? this.inferMediaType(file.mimetype),
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      metadata: options.metadata ?? null,
    });

    return { media, isNew: true };
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
