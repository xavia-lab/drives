import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalDrive } from '../../physical-drive/entities/physical-drive.entity';

// Define a structural TypeScript enum matching your explicit database ENUM constraints
export enum DriveLifecycleEventType {
  RECEIVE = 'RECEIVE',
  PROVISION = 'PROVISION',
  DEGRADE = 'DEGRADE',
  FAIL = 'FAIL',
  RMA_INITIATE = 'RMA_INITIATE',
  SCRAP_SHRED = 'SCRAP_SHRED',
}

@Table({
  tableName: 'drive_lifecycle_events',
  timestamps: true,
  underscored: true, // Aligns JavaScript camelCase columns with your database snake_case fields
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
  declare contextMetadata: Record<string, any> | null; // Typed for flexible key-value S.M.A.R.T telemetry objects

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => PhysicalDrive)
  @Column({
    type: DataType.UUID, // Matches the updated primary key of physical_drives
    allowNull: false,
    field: 'physical_drive_id',
  })
  declare physicalDriveId: string;

  @BelongsTo(() => PhysicalDrive, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare physicalDrive: PhysicalDrive;
}
