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

import { Server } from '../../server/entities/server.entity';
import { VirtualServer } from '../../virtual-server/entities/virtual-server.entity';

// Define a structural TypeScript enum matching your explicit database ENUM constraints
export enum StoragePoolType {
  ZFS = 'ZFS',
  BTRFS = 'BTRFS',
  CEPH_OSD_POOL = 'CEPH_OSD_POOL',
  MDRAID = 'MDRAID',
  RAW_JBOD = 'RAW_JBOD',
}

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
        server_id: { [sequelize.Op.ne]: null },
      },
    },
    {
      name: 'storage_pools_virtual_server_id_idx',
      using: 'btree',
      fields: ['virtual_server_id'],
      where: {
        virtual_server_id: { [sequelize.Op.ne]: null },
      },
    },
  ],
})
export class StoragePool extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false, // e.g., 'tank-nvme-cache', 'btrfs-data-array'
    field: 'pool_name',
  })
  declare poolName: string;

  @Column({
    type: DataType.ENUM(...Object.values(StoragePoolType)),
    allowNull: false,
    field: 'pool_type',
  })
  declare poolType: StoragePoolType;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'encryption_enabled',
  })
  declare encryptionEnabled: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => Server)
  @Column({
    type: DataType.UUID,
    allowNull: true, // Nullable: Only populated if the pool is managed directly by a bare-metal host OS
    field: 'server_id',
  })
  declare serverId: string | null;

  @BelongsTo(() => Server, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare server: Server | null;

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
