import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import sequelize from 'sequelize';

import { LogicalVdev } from '../../logical-vdev/entities/logical-vdev.entity';
import { PhysicalDrive } from '../../physical-drive/entities/physical-drive.entity';

@Table({
  tableName: 'logical_disks',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
  // Class-level unique and performance optimization indexes mapped from the migration
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
  ],
})
export class LogicalDisk extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false, // e.g., '/dev/nvme0n1', '/dev/sda'
    field: 'os_device_node_path',
  })
  declare osDeviceNodePath: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false, // True if flagged as a hot-spare for automated pool rebuilding
    allowNull: false,
    field: 'is_spare_drive',
  })
  declare isSpareDrive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => LogicalVdev)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'logical_vdev_id',
  })
  declare logicalVdevId: string;

  @BelongsTo(() => LogicalVdev, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare logicalVdev: LogicalVdev;

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
}
