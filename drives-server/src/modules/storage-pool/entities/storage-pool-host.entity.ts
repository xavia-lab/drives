import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { BaseModel } from '../../../shared/entities/base.model';
import { StoragePool } from './storage-pool.entity';
import { PhysicalServer } from '../../physical-server/entities/physical-server.entity';
import { VirtualServer } from '../../virtual-server/entities/virtual-server.entity';

export enum StoragePoolHostEventType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
}

/**
 * Append-only IMPORT/EXPORT log describing which host a storage pool is
 * attached to over time. There is no `is_active` flag: a pool's current host is
 * derived from its latest event (IMPORT => attached, EXPORT => detached) and
 * the "at most one host" invariant is enforced in the service inside a
 * transaction that locks the owning pool row.
 */
@Table({
  tableName: 'storage_pool_hosts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'storage_pool_hosts_history_idx',
      using: 'btree',
      fields: ['storage_pool_id', 'event_timestamp'],
    },
    {
      name: 'storage_pool_hosts_physical_server_id_idx',
      using: 'btree',
      fields: ['physical_server_id'],
      where: { physical_server_id: { [Op.ne]: null } },
    },
    {
      name: 'storage_pool_hosts_virtual_server_id_idx',
      using: 'btree',
      fields: ['virtual_server_id'],
      where: { virtual_server_id: { [Op.ne]: null } },
    },
  ],
})
export class StoragePoolHost extends BaseModel {
  @Column({
    type: DataType.ENUM(...Object.values(StoragePoolHostEventType)),
    allowNull: false,
    field: 'event_type',
  })
  declare eventType: StoragePoolHostEventType;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'event_timestamp',
  })
  declare eventTimestamp: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => StoragePool)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'storage_pool_id',
  })
  declare storagePoolId: string;

  @BelongsTo(() => StoragePool, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare storagePool: StoragePool;

  @ForeignKey(() => PhysicalServer)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'physical_server_id',
  })
  declare physicalServerId: string | null;

  @BelongsTo(() => PhysicalServer, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare physicalServer: PhysicalServer | null;

  @ForeignKey(() => VirtualServer)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'virtual_server_id',
  })
  declare virtualServerId: string | null;

  @BelongsTo(() => VirtualServer, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare virtualServer: VirtualServer | null;
}
