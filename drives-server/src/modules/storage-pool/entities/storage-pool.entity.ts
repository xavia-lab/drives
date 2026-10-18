import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalServer } from '../../physical-server/entities/physical-server.entity';
import { VirtualServer } from '../../virtual-server/entities/virtual-server.entity';
import { PoolType } from '../../pool-type/entities/pool-type.entity';

@Table({
  tableName: 'storage_pools',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
  // 🌟 Class-level partial database indexes mapped exactly from the migration file
  indexes: [
    {
      name: 'storage_pools_server_id_idx',
      using: 'btree',
      fields: ['server_id'],
      where: {
        server_id: { [Op.ne]: null },
      },
    },
    {
      name: 'storage_pools_virtual_server_id_idx',
      using: 'btree',
      fields: ['virtual_server_id'],
      where: {
        virtual_server_id: { [Op.ne]: null },
      },
    },
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

  @ForeignKey(() => PhysicalServer)
  @Column({
    type: DataType.UUID,
    allowNull: true, // Nullable: Only populated if the pool is managed directly by a bare-metal host OS
    field: 'server_id',
  })
  declare serverId: string | null;

  @BelongsTo(() => PhysicalServer, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare server: PhysicalServer | null;

  @ForeignKey(() => VirtualServer)
  @Column({
    type: DataType.UUID,
    allowNull: true, // Nullable: Only populated if the pool belongs to a virtualized guest VM/container
    field: 'virtual_server_id',
  })
  declare virtualServerId: string | null;

  @BelongsTo(() => VirtualServer, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare virtualServer: VirtualServer | null;
}
