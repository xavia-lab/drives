import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Media } from '../media/entities/media.entity';
import { MediaService } from '../media/media.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import {
  PhysicalDriveMedia,
  PhysicalDriveMediaType,
} from './entities/physical-drive-media.entity';
import {
  PhysicalDriveMediaUpdateItemDto,
  PhysicalDriveMediaUploadItemDto,
} from './dto/physical-drive-media.dto';
import { UpdatePhysicalDriveMediaDto } from './dto/update-physical-drive-media.dto';

export interface ManagePhysicalDriveMediaInput {
  files?: Express.Multer.File[];
  add?: PhysicalDriveMediaUploadItemDto[];
  update?: PhysicalDriveMediaUpdateItemDto[];
  remove?: string[];
}

@Injectable()
export class PhysicalDriveMediaService {
  constructor(
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(PhysicalDriveMedia)
    private readonly physicalDriveMediaModel: typeof PhysicalDriveMedia,
    private readonly mediaService: MediaService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async findForDrive(driveId: string): Promise<PhysicalDriveMedia[]> {
    await this.assertDriveExists(driveId);

    return this.physicalDriveMediaModel.findAll({
      where: { physicalDriveId: driveId },
      include: [Media],
      order: [
        ['isPrimary', 'DESC'],
        ['sortOrder', 'ASC'],
        ['displayKey', 'ASC'],
      ],
    });
  }

  /**
   * Canonical media mutation: add, update and remove attachments in one DB
   * transaction. All sections are optional, so callers can use the same method
   * for attach-only workloads such as drive acquisition.
   *
   * Content-store writes happen before the transaction (the content store is
   * not transactional); the media and join rows are written atomically.
   */
  async manageMedia(
    driveId: string,
    input: ManagePhysicalDriveMediaInput = {},
  ): Promise<PhysicalDriveMedia[]> {
    const files = input.files ?? [];
    const addItems = input.add ?? [];
    const updateItems = input.update ?? [];
    const removeIds = input.remove ?? [];

    if (
      files.length === 0 &&
      addItems.length === 0 &&
      updateItems.length === 0 &&
      removeIds.length === 0
    ) {
      return this.findForDrive(driveId);
    }

    if (files.length === 0 && addItems.length > 0) {
      throw new BadRequestException(
        'Attachment metadata was provided without any files',
      );
    }

    const removeSet = new Set(removeIds);
    if (removeSet.size !== removeIds.length) {
      throw new BadRequestException('Duplicate attachment ids in remove');
    }
    if (updateItems.some((item) => removeSet.has(item.attachmentId))) {
      throw new BadRequestException(
        'The same attachment cannot be updated and removed',
      );
    }

    await this.assertDriveExists(driveId);

    // Upload first so the DB transaction stays short. Identical content is
    // deduplicated by MediaService, and media rows remain reusable if the
    // attachment transaction later fails.
    const uploaded: Array<{
      mediaId: string;
      attachmentType: PhysicalDriveMediaType;
      notes: string | null;
      isPrimary: boolean;
      sortOrder?: number;
    }> = [];
    let addPrimarySeen = false;

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const item = addItems[index] ?? {};
      const { media } = await this.mediaService.trackUpload(file);

      const isPrimary = Boolean(item.isPrimary) && !addPrimarySeen;
      if (isPrimary) addPrimarySeen = true;

      const existingUpload = uploaded.find(
        (entry) => entry.mediaId === media.id,
      );
      if (existingUpload) {
        existingUpload.attachmentType =
          item.attachmentType ?? existingUpload.attachmentType;
        existingUpload.notes = item.notes?.trim() || existingUpload.notes;
        existingUpload.isPrimary = existingUpload.isPrimary || isPrimary;
        existingUpload.sortOrder = item.sortOrder ?? existingUpload.sortOrder;
        continue;
      }

      uploaded.push({
        mediaId: media.id,
        attachmentType:
          item.attachmentType ?? this.inferAttachmentType(file.mimetype),
        notes: item.notes?.trim() || null,
        isPrimary,
        sortOrder: item.sortOrder,
      });
    }

    await this.sequelize.transaction(async (transaction) => {
      await this.lockDrive(driveId, transaction);

      const current = await this.physicalDriveMediaModel.findAll({
        where: { physicalDriveId: driveId },
        transaction,
      });
      const currentById = new Map(current.map((item) => [item.id, item]));

      for (const attachmentId of removeIds) {
        if (!currentById.has(attachmentId)) {
          throw new NotFoundException(
            `Media attachment ${attachmentId} was not found for this drive`,
          );
        }
      }
      for (const item of updateItems) {
        if (!currentById.has(item.attachmentId)) {
          throw new NotFoundException(
            `Media attachment ${item.attachmentId} was not found for this drive`,
          );
        }
      }

      let desiredPrimaryId =
        current.find((item) => item.isPrimary && !removeSet.has(item.id))?.id ??
        null;

      for (const item of updateItems) {
        if (item.isPrimary === true) desiredPrimaryId = item.attachmentId;
        if (
          item.isPrimary === false &&
          desiredPrimaryId === item.attachmentId
        ) {
          desiredPrimaryId = null;
        }
      }

      if (removeIds.length > 0) {
        await this.physicalDriveMediaModel.destroy({
          where: { id: removeIds, physicalDriveId: driveId },
          transaction,
        });
      }

      for (const item of updateItems) {
        const attachment = currentById.get(item.attachmentId);
        if (!attachment) continue;

        const update: Partial<PhysicalDriveMedia> = {};
        if (item.attachmentType !== undefined)
          update.attachmentType = item.attachmentType;
        if (item.notes !== undefined) update.notes = item.notes?.trim() || null;
        if (item.sortOrder !== undefined) update.sortOrder = item.sortOrder;

        await attachment.update(update, { transaction });
      }

      let nextSortOrder =
        current.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
      const remainingByMediaId = new Map(
        current
          .filter((item) => !removeSet.has(item.id))
          .map((item) => [item.mediaId, item]),
      );
      const created: PhysicalDriveMedia[] = [];
      let newPrimaryIndex = -1;

      for (let index = 0; index < uploaded.length; index += 1) {
        const item = uploaded[index];
        const existing = remainingByMediaId.get(item.mediaId);

        if (existing) {
          await existing.update(
            {
              attachmentType: item.attachmentType,
              notes: item.notes,
              sortOrder: item.sortOrder ?? existing.sortOrder,
            },
            { transaction },
          );
          created.push(existing);
          if (item.isPrimary) newPrimaryIndex = created.length - 1;
          continue;
        }

        const attachment = await this.physicalDriveMediaModel.create(
          {
            physicalDriveId: driveId,
            mediaId: item.mediaId,
            attachmentType: item.attachmentType,
            notes: item.notes,
            isPrimary: false,
            sortOrder: item.sortOrder ?? nextSortOrder,
          },
          { transaction },
        );
        created.push(attachment);
        remainingByMediaId.set(item.mediaId, attachment);
        if (item.isPrimary) newPrimaryIndex = created.length - 1;
        nextSortOrder += 1;
      }

      if (newPrimaryIndex >= 0) {
        desiredPrimaryId = created[newPrimaryIndex].id;
      }

      await this.physicalDriveMediaModel.update(
        { isPrimary: false },
        { where: { physicalDriveId: driveId }, transaction },
      );

      if (desiredPrimaryId) {
        await this.physicalDriveMediaModel.update(
          { isPrimary: true },
          {
            where: { id: desiredPrimaryId, physicalDriveId: driveId },
            transaction,
          },
        );
      }
    });

    return this.findForDrive(driveId);
  }

  async attachFiles(
    driveId: string,
    files: Express.Multer.File[],
    attachments: PhysicalDriveMediaUploadItemDto[] = [],
  ): Promise<PhysicalDriveMedia[]> {
    if (files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    return this.manageMedia(driveId, { files, add: attachments });
  }

  async updateAttachment(
    driveId: string,
    attachmentId: string,
    dto: UpdatePhysicalDriveMediaDto,
  ): Promise<PhysicalDriveMedia> {
    await this.manageMedia(driveId, {
      update: [{ attachmentId, ...dto }],
    });

    const attachment = await this.physicalDriveMediaModel.findOne({
      where: { id: attachmentId, physicalDriveId: driveId },
      include: [Media],
    });

    if (!attachment) {
      throw new NotFoundException(
        `Media attachment ${attachmentId} was not found for this drive`,
      );
    }

    return attachment;
  }

  async detach(driveId: string, attachmentId: string): Promise<void> {
    await this.manageMedia(driveId, { remove: [attachmentId] });
  }

  private async assertDriveExists(driveId: string): Promise<void> {
    const drive = await this.physicalDriveModel.findByPk(driveId, {
      attributes: ['id'],
    });
    if (!drive) {
      throw new NotFoundException(`PhysicalDrive with ID ${driveId} not found`);
    }
  }

  private async lockDrive(
    driveId: string,
    transaction: Transaction,
  ): Promise<void> {
    await this.physicalDriveModel.findByPk(driveId, {
      attributes: ['id'],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  private inferAttachmentType(mimetype: string): PhysicalDriveMediaType {
    if (mimetype.startsWith('image/')) return PhysicalDriveMediaType.PICTURE;
    return PhysicalDriveMediaType.DOCUMENT;
  }
}
