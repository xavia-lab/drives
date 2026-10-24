import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { LogicalVdev } from '../../logical-vdev/entities/logical-vdev.entity';
import { PhysicalDrive } from '../../physical-drive/entities/physical-drive.entity';

export enum VdevMemberRole {
  DATA = 'DATA',
  SPARE = 'SPARE',
}

@Table({
  tableName: 'logical_disks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'logical_disks_phys_drive_unique_idx',
      unique: true,
      fields: ['physical_drive_id'],
    },
    {
      name: 'logical_disks_logical_vdev_id_idx',
      using: 'btree',
      fields: ['logical_vdev_id'],
    },
    {
      name: 'logical_disks_vdev_order_idx',
      using: 'btree',
      fields: ['logical_vdev_id', 'group_index', 'member_index'],
    },
  ],
})
export class LogicalDisk extends BaseModel {
  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    field: 'os_device_node_path',
  })
  declare osDeviceNodePath: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(VdevMemberRole)),
    allowNull: false,
    defaultValue: VdevMemberRole.DATA,
    field: 'member_role',
  })
  declare memberRole: VdevMemberRole;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'attached_at',
  })
  declare attachedAt: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'member_index',
  })
  declare memberIndex: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'group_index' })
  declare groupIndex: number | null;

  @ForeignKey(() => LogicalVdev)
  @Column({ type: DataType.UUID, allowNull: false, field: 'logical_vdev_id' })
  declare logicalVdevId: string;

  @BelongsTo(() => LogicalVdev, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare logicalVdev: LogicalVdev;

  @ForeignKey(() => PhysicalDrive)
  @Column({ type: DataType.UUID, allowNull: false, field: 'physical_drive_id' })
  declare physicalDriveId: string;

  @BelongsTo(() => PhysicalDrive, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare physicalDrive: PhysicalDrive;
}
