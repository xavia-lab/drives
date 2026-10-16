import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { Server } from '../../server/entities/server.entity';
import { Interface } from '../../interface/entities/interface.entity';

@Table({
  tableName: 'server_slots',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
  // 🌟 Class-level composite unique index mapped exactly from the migration file
  indexes: [
    {
      name: 'server_slots_label_unique_idx',
      unique: true,
      fields: ['server_id', 'slot_label'],
    },
  ],
})
export class ServerSlot extends BaseModel {
  @Column({
    type: DataType.STRING(32),
    allowNull: false, // Physical label on the case (e.g., 'Bay 0')
    field: 'slot_label',
  })
  declare slotLabel: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true, // OS hardware topology string (e.g., '0000:41:00.0')
    field: 'pcie_bus_address',
  })
  declare pcieBusAddress: string | null;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => Server)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'server_id',
  })
  declare serverId: string;

  @BelongsTo(() => Server, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare server: Server;

  @ForeignKey(() => Interface)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'supported_interface_id',
  })
  declare supportedInterfaceId: string;

  @BelongsTo(() => Interface, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare supportedInterface: Interface;
}
