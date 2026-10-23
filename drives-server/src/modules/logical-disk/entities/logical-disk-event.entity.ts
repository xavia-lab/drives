import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalDrive } from '../../physical-drive/entities/physical-drive.entity';
import { LogicalVdev } from '../../logical-vdev/entities/logical-vdev.entity';
import { User } from '../../user/entities/user.entity';
import { VdevMemberRole } from './logical-disk.entity';

export enum VdevMembershipAction {
  ATTACH = 'ATTACH',
  DETACH = 'DETACH',
  MOVE = 'MOVE',
  UPDATE = 'UPDATE',
}

@Table({
  tableName: 'logical_disk_events',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'logical_disk_events_drive_history_idx',
      using: 'btree',
      fields: ['physical_drive_id', 'event_timestamp', 'display_key'],
    },
    {
      name: 'logical_disk_events_from_vdev_idx',
      using: 'btree',
      fields: ['from_vdev_id', 'event_timestamp'],
    },
    {
      name: 'logical_disk_events_to_vdev_idx',
      using: 'btree',
      fields: ['to_vdev_id', 'event_timestamp'],
    },
    {
      name: 'logical_disk_events_correlation_idx',
      using: 'btree',
      fields: ['correlation_id'],
    },
    {
      name: 'logical_disk_events_performed_by_idx',
      using: 'btree',
      fields: ['performed_by_user_id'],
    },
  ],
})
export class LogicalDiskEvent extends BaseModel {
  @Column({
    type: DataType.ENUM(...Object.values(VdevMembershipAction)),
    allowNull: false,
  })
  declare action: VdevMembershipAction;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'event_timestamp',
  })
  declare eventTimestamp: Date;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    field: 'os_device_node_path',
  })
  declare osDeviceNodePath: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(VdevMemberRole)),
    allowNull: true,
    field: 'member_role',
  })
  declare memberRole: VdevMemberRole | null;

  @Column({ type: DataType.UUID, allowNull: true, field: 'correlation_id' })
  declare correlationId: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  @Column({ type: DataType.JSONB, allowNull: true, field: 'context_metadata' })
  declare contextMetadata: Record<string, unknown> | null;

  @ForeignKey(() => PhysicalDrive)
  @Column({ type: DataType.UUID, allowNull: false, field: 'physical_drive_id' })
  declare physicalDriveId: string;

  @BelongsTo(() => PhysicalDrive, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare physicalDrive: PhysicalDrive;

  @ForeignKey(() => LogicalVdev)
  @Column({ type: DataType.UUID, allowNull: true, field: 'logical_vdev_id' })
  declare logicalVdevId: string | null;

  @BelongsTo(() => LogicalVdev, {
    foreignKey: 'logicalVdevId',
    as: 'logicalVdev',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare logicalVdev: LogicalVdev | null;

  @ForeignKey(() => LogicalVdev)
  @Column({ type: DataType.UUID, allowNull: true, field: 'from_vdev_id' })
  declare fromVdevId: string | null;

  @BelongsTo(() => LogicalVdev, {
    foreignKey: 'fromVdevId',
    as: 'fromVdev',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare fromVdev: LogicalVdev | null;

  @ForeignKey(() => LogicalVdev)
  @Column({ type: DataType.UUID, allowNull: true, field: 'to_vdev_id' })
  declare toVdevId: string | null;

  @BelongsTo(() => LogicalVdev, {
    foreignKey: 'toVdevId',
    as: 'toVdev',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare toVdev: LogicalVdev | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'performed_by_user_id',
  })
  declare performedByUserId: string | null;

  @BelongsTo(() => User, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  declare performedByUser: User | null;
}
