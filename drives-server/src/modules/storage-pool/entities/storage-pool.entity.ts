import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { PoolType } from '../../pool-type/entities/pool-type.entity';
import { StoragePoolHost } from './storage-pool-host.entity';

@Table({
  tableName: 'storage_pools',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
  // 🌟 Class-level partial database indexes mapped exactly from the migration file
  indexes: [
    {
      name: 'storage_pools_pool_type_id_idx',
      using: 'btree',
      fields: ['pool_type_id'],
    },
  ],
})
export class StoragePool extends BaseModel {
  @Column({
    type: DataType.STRING(64),
    allowNull: false, // e.g., 'tank-nvme-cache', 'btrfs-data-array'
    field: 'pool_name',
  })
  declare poolName: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'encryption_enabled',
  })
  declare encryptionEnabled: boolean;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => PoolType)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'pool_type_id',
  })
  declare poolTypeId: string;

  @BelongsTo(() => PoolType, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare poolType: PoolType;

  // Append-only IMPORT/EXPORT log. The pool's current host is derived from the
  // latest event rather than stored on this row.
  @HasMany(() => StoragePoolHost, { as: 'hosts' })
  declare hosts: StoragePoolHost[];
}
