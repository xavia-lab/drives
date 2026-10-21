import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalDrive } from './physical-drive.entity';
import { Media } from '../../media/entities/media.entity';

export enum PhysicalDriveMediaType {
  PICTURE = 'PICTURE',
  INVOICE = 'INVOICE',
  DOCUMENT = 'DOCUMENT',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER',
}

/**
 * Attaches a content-store media record to a physical drive. The join row
 * carries the attachment's purpose and presentation metadata, while the media
 * row owns the content hash and file metadata.
 */
@Table({
  tableName: 'physical_drive_media',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'physical_drive_media_drive_media_unique_idx',
      unique: true,
      fields: ['physical_drive_id', 'media_id'],
    },
    {
      name: 'physical_drive_media_drive_idx',
      fields: ['physical_drive_id', 'attachment_type'],
    },
    {
      name: 'physical_drive_media_media_idx',
      fields: ['media_id'],
    },
  ],
})
export class PhysicalDriveMedia extends BaseModel {
  @Column({
    type: DataType.ENUM(...Object.values(PhysicalDriveMediaType)),
    allowNull: false,
    defaultValue: PhysicalDriveMediaType.OTHER,
    field: 'attachment_type',
  })
  declare attachmentType: PhysicalDriveMediaType;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_primary',
  })
  declare isPrimary: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
  })
  declare sortOrder: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @ForeignKey(() => PhysicalDrive)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'physical_drive_id',
  })
  declare physicalDriveId: string;

  @BelongsTo(() => PhysicalDrive, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare physicalDrive: PhysicalDrive;

  @ForeignKey(() => Media)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'media_id',
  })
  declare mediaId: string;

  @BelongsTo(() => Media, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare media: Media;
}
