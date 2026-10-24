import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { StoragePool } from '../../storage-pool/entities/storage-pool.entity';
import { VdevProfile } from '../../vdev-profile/entities/vdev-profile.entity';

export enum VdevClass {
  DATA = 'DATA',
  LOG = 'LOG',
  CACHE = 'CACHE',
  SPECIAL = 'SPECIAL',
  SPARE = 'SPARE',
}

@Table({
  tableName: 'logical_vdevs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'logical_vdevs_storage_pool_id_idx',
      using: 'btree',
      fields: ['storage_pool_id'],
    },
    {
      name: 'logical_vdevs_pool_name_unique_idx',
      unique: true,
      fields: ['storage_pool_id', 'vdev_name'],
    },
    {
      name: 'logical_vdevs_redundancy_profile_id_idx',
      using: 'btree',
      fields: ['redundancy_profile_id'],
    },
  ],
})
export class LogicalVdev extends BaseModel {
  @Column({ type: DataType.STRING(32), allowNull: false, field: 'vdev_name' })
  declare vdevName: string;

  @Column({
    type: DataType.ENUM(...Object.values(VdevClass)),
    allowNull: false,
    defaultValue: VdevClass.DATA,
    field: 'vdev_class',
  })
  declare vdevClass: VdevClass;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
  })
  declare sortOrder: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  @Column({ type: DataType.JSONB, allowNull: true, field: 'profile_snapshot' })
  declare profileSnapshot: Record<string, unknown> | null;

  @ForeignKey(() => StoragePool)
  @Column({ type: DataType.UUID, allowNull: false, field: 'storage_pool_id' })
  declare storagePoolId: string;

  @BelongsTo(() => StoragePool, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare storagePool: StoragePool;

  @ForeignKey(() => VdevProfile)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'redundancy_profile_id',
  })
  declare redundancyProfileId: string;

  @BelongsTo(() => VdevProfile, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare redundancyProfile: VdevProfile;
}
