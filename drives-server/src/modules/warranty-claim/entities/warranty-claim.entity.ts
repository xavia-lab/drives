import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalDrive } from '../../physical-drive/entities/physical-drive.entity';
import { DriveLifecycleEvent } from '../../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { Vendor } from '../../vendor/entities/vendor.entity';

// Derived status of a warranty claim. It is computed from the latest
// state-changing event in the claim's tracking log; a claim with no events is
// reported as SUBMITTED (creating the claim is the submission).
export enum WarrantyClaimStatus {
  SUBMITTED = 'SUBMITTED',
  SHIPPED_TO_VENDOR = 'SHIPPED_TO_VENDOR',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REPLACEMENT_RECEIVED = 'REPLACEMENT_RECEIVED',
  CLOSED = 'CLOSED',
}

// The claim header holds the immutable identity/details captured when the RMA
// is opened. Status and lifecycle timestamps are DERIVED from the append-only
// `warranty_claim_events` log (see WarrantyClaimEvent), never stored here.
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

  @Column(DataType.TEXT)
  declare notes: string | null;

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
    allowNull: true, // Nullable because some warranties might be bulk preventative returns
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
