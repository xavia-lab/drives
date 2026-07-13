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

import { ServerSlot } from '../../server-slot/entities/server-slot.entity';
import { PhysicalDrive } from '../../physical-drive/entities/physical-drive.entity';
import { User } from '../../user/entities/user.entity'; // Adjust path based on your User entity location

// Define a structural TypeScript enum matching your explicit database ENUM constraints
export enum ServerSlotActionType {
  MOUNT = 'MOUNT',
  UNMOUNT = 'UNMOUNT',
}

@Table({
  tableName: 'server_slot_allocations',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
  // 🌟 Class-level database audit indexes mapped exactly from the migration file
  indexes: [
    {
      name: 'server_slot_allocations_history_idx',
      using: 'btree',
      fields: ['server_slot_id', 'timestamp'],
    },
    {
      name: 'physical_drives_allocation_history_idx',
      using: 'btree',
      fields: ['physical_drive_id', 'timestamp'],
    },
    {
      name: 'server_slot_allocations_user_idx',
      using: 'btree',
      fields: ['user_id'],
    },
  ],
})
export class ServerSlotAllocation extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(ServerSlotActionType)),
    allowNull: false,
    field: 'action_type',
  })
  declare actionType: ServerSlotActionType;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  })
  declare timestamp: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => ServerSlot)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'server_slot_id',
  })
  declare serverSlotId: string;

  @BelongsTo(() => ServerSlot, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare serverSlot: ServerSlot;

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

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: string;

  @BelongsTo(() => User, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare user: User;
}
