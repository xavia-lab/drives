import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalDrive } from '../../physical-drive/entities/physical-drive.entity';
import { User } from '../../user/entities/user.entity';

// Discrete actions that may be appended to a drive's lifecycle log. The
// derived `DriveLifecycleState` is computed from these (see
// drive-lifecycle-state-machine.ts); an action is not itself a state.
export enum DriveLifecycleEventType {
  ACQUIRE = 'ACQUIRE',
  PROVISION = 'PROVISION',
  DEPROVISION = 'DEPROVISION',
  DEGRADE = 'DEGRADE',
  RECOVER = 'RECOVER',
  FAIL = 'FAIL',
  RMA_INITIATE = 'RMA_INITIATE',
  RMA_SHIP = 'RMA_SHIP',
  RMA_APPROVE = 'RMA_APPROVE',
  RMA_REJECT = 'RMA_REJECT',
  RMA_REPLACE = 'RMA_REPLACE',
  RMA_CLOSE = 'RMA_CLOSE',
  RETIRE = 'RETIRE',
  SCRAP_SHRED = 'SCRAP_SHRED',
  LOST = 'LOST',
  INSPECT = 'INSPECT',
  NOTE = 'NOTE',
}

// The state a drive is currently in, DERIVED from the latest state-changing
// event in its log (never stored on the drive row).
export enum DriveLifecycleState {
  UNRECEIVED = 'UNRECEIVED',
  RECEIVED = 'RECEIVED',
  IN_INVENTORY = 'IN_INVENTORY',
  IN_SERVICE = 'IN_SERVICE',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED',
  IN_RMA = 'IN_RMA',
  RETIRED = 'RETIRED',
  SCRAPPED = 'SCRAPPED',
  REPLACED = 'REPLACED',
  LOST = 'LOST',
}

@Table({
  tableName: 'drive_lifecycle_events',
  timestamps: true,
  underscored: true,
})
export class DriveLifecycleEvent extends BaseModel {
  @Column({
    type: DataType.ENUM(...Object.values(DriveLifecycleEventType)),
    allowNull: false,
    field: 'event_type',
  })
  declare eventType: DriveLifecycleEventType;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'event_timestamp',
  })
  declare eventTimestamp: Date;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    field: 'triggered_by',
  })
  declare triggeredBy: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    field: 'context_metadata',
  })
  declare contextMetadata: Record<string, unknown> | null;

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

  // The human operator who recorded the event. Keycloak subjects are UUIDs;
  // automation/agent entries leave this null and rely on `triggeredBy`.
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

  // Only set on `RMA_REPLACE`: the successor drive shipped by the vendor.
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
}
