import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import sequelize from 'sequelize';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalDrive } from '../../physical-drive/entities/physical-drive.entity';
import { DriveLifecycleEvent } from '../../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { Vendor } from '../../vendor/entities/vendor.entity';

// Define a structural TypeScript enum matching your explicit database ENUM constraints
export enum WarrantyClaimStatus {
  SUBMITTED = 'SUBMITTED',
  SHIPPED_TO_VENDOR = 'SHIPPED_TO_VENDOR',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REPLACEMENT_RECEIVED = 'REPLACEMENT_RECEIVED',
}

@Table({
  tableName: 'warranty_claims',
  timestamps: true,
  underscored: true, // Aligns JavaScript camelCase variables with database snake_case columns
})
export class WarrantyClaim extends BaseModel {
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    field: 'rma_tracking_number',
  })
  declare rmaTrackingNumber: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(WarrantyClaimStatus)),
    defaultValue: WarrantyClaimStatus.SUBMITTED,
    allowNull: false,
    field: 'claim_status',
  })
  declare claimStatus: WarrantyClaimStatus;

  @Column(DataType.TEXT)
  declare notes: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    field: 'submitted_at',
  })
  declare submittedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'resolved_at',
  })
  declare resolvedAt: Date | null;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => PhysicalDrive)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'physical_drive_id',
  })
  declare physicalDriveId: string;

  @BelongsTo(() => PhysicalDrive, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare physicalDrive: PhysicalDrive;

  @ForeignKey(() => DriveLifecycleEvent)
  @Column({
    type: DataType.UUID,
    allowNull: true, // Matches structural migration nullable allowance
    field: 'triggering_event_id',
  })
  declare triggeringEventId: string | null;

  @BelongsTo(() => DriveLifecycleEvent, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare triggeringEvent: DriveLifecycleEvent | null;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'handled_by_vendor_id',
  })
  declare handledByVendorId: string;

  @BelongsTo(() => Vendor, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare handledByVendor: Vendor;
}
