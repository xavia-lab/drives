import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { VirtualServer } from './virtual-server.entity';
import { ServerSlot } from '../../physical-server/entities/server-slot.entity';

/**
 * Maps a physical server backplane slot (owned by the virtual server's host)
 * into a virtual server as a hardware passthrough device. The unique index on
 * `server_slot_id` guarantees a host slot can be passed through to only one
 * virtual server.
 */
@Table({
  tableName: 'passthrough_slots',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'passthrough_slots_virtual_server_id_idx',
      using: 'btree',
      fields: ['virtual_server_id'],
    },
    {
      name: 'passthrough_slots_server_slot_id_unique_idx',
      unique: true,
      fields: ['server_slot_id'],
    },
  ],
})
export class PassthroughSlot extends BaseModel {
  // --- Foreign Keys and Associations ---

  @ForeignKey(() => VirtualServer)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'virtual_server_id',
  })
  declare virtualServerId: string;

  @BelongsTo(() => VirtualServer, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare virtualServer: VirtualServer;

  @ForeignKey(() => ServerSlot)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'server_slot_id',
  })
  declare serverSlotId: string;

  @BelongsTo(() => ServerSlot, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare serverSlot: ServerSlot;
}
