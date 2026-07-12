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

import { StoragePool } from '../../storage-pool/entities/storage-pool.entity';

// Define a structural TypeScript enum matching your explicit database ENUM constraints
export enum VdevRedundancyProfile {
  STRIPE = 'STRIPE',
  MIRROR = 'MIRROR',
  RAIDZ1 = 'RAIDZ1',
  RAIDZ2 = 'RAIDZ2',
  RAIDZ3 = 'RAIDZ3',
  JBOD_SINGLE = 'JBOD_SINGLE',
}

@Table({
  tableName: 'logical_vdevs',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
  // 🌟 Class-level database index mapped exactly from the migration file
  indexes: [
    {
      name: 'logical_vdevs_storage_pool_id_idx',
      using: 'btree',
      fields: ['storage_pool_id'],
    },
  ],
})
export class LogicalVdev extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false, // e.g., 'raidz2-0', 'mirror-1'
    field: 'vdev_name',
  })
  declare vdevName: string;

  @Column({
    type: DataType.ENUM(...Object.values(VdevRedundancyProfile)),
    allowNull: false,
    field: 'vdev_redundancy_profile',
  })
  declare vdevRedundancyProfile: VdevRedundancyProfile;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => StoragePool)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'storage_pool_id',
  })
  declare storagePoolId: string;

  @BelongsTo(() => StoragePool, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare storagePool: StoragePool;
}
