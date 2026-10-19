import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { WarrantyClaim } from './warranty-claim.entity';
import { PhysicalDrive } from '../../physical-drive/entities/physical-drive.entity';
import { User } from '../../user/entities/user.entity';

// Discrete actions appended to a warranty claim's tracking log. The derived
// `WarrantyClaimStatus` (see warranty-claim-state-machine.ts) is computed from
// these; an action is not itself a status.
export enum WarrantyClaimEventType {
  SHIPPED_TO_VENDOR = 'SHIPPED_TO_VENDOR',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REPLACEMENT_RECEIVED = 'REPLACEMENT_RECEIVED',
  CLOSED = 'CLOSED',
  NOTE = 'NOTE',
}

@Table({
  tableName: 'warranty_claim_events',
  timestamps: true,
  underscored: true,
})
export class WarrantyClaimEvent extends BaseModel {
  @Column({
    type: DataType.ENUM(...Object.values(WarrantyClaimEventType)),
    allowNull: false,
    field: 'event_type',
  })
  declare eventType: WarrantyClaimEventType;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'event_timestamp',
  })
  declare eventTimestamp: Date;

  @Column(DataType.TEXT)
  declare notes: string | null;

  // The human operator who recorded the event. Null for automation entries.
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'performed_by_user_id',
  })
  declare performedByUserId: string | null;

  @BelongsTo(() => User, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare performedBy: User | null;

  // The successor drive received from the vendor. Only set on
  // `REPLACEMENT_RECEIVED` events.
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'replacement_physical_drive_id',
  })
  declare replacementPhysicalDriveId: string | null;

  @BelongsTo(() => PhysicalDrive, {
    as: 'replacementDrive',
    foreignKey: 'replacementPhysicalDriveId',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare replacementDrive: PhysicalDrive | null;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => WarrantyClaim)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'warranty_claim_id',
  })
  declare warrantyClaimId: string;

  @BelongsTo(() => WarrantyClaim, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare warrantyClaim: WarrantyClaim;
}
