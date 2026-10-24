import { Table, Column, DataType } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

export enum VdevTechnology {
  ZFS = 'ZFS',
  MDRAID = 'MDRAID',
  BTRFS = 'BTRFS',
  CEPH = 'CEPH',
  GENERIC = 'GENERIC',
}

export enum VdevCapacityMode {
  SUM = 'SUM',
  MIN = 'MIN',
  PARITY = 'PARITY',
  MIRROR_GROUPS = 'MIRROR_GROUPS',
}

@Table({
  tableName: 'vdev_profiles',
  timestamps: true,
  underscored: true,
  indexes: [
    { name: 'vdev_profiles_code_unique_idx', unique: true, fields: ['code'] },
  ],
})
export class VdevProfile extends BaseModel {
  @Column({ type: DataType.STRING(32), allowNull: false })
  declare code: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    field: 'display_name',
  })
  declare displayName: string;

  @Column({
    type: DataType.ENUM(...Object.values(VdevTechnology)),
    allowNull: false,
    defaultValue: VdevTechnology.GENERIC,
  })
  declare technology: VdevTechnology;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'min_members',
  })
  declare minMembers: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'max_members' })
  declare maxMembers: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'parity_members',
  })
  declare parityMembers: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'mirror_copies',
  })
  declare mirrorCopies: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'stripe_width' })
  declare stripeWidth: number | null;

  @Column({
    type: DataType.ENUM(...Object.values(VdevCapacityMode)),
    allowNull: false,
    defaultValue: VdevCapacityMode.SUM,
    field: 'capacity_mode',
  })
  declare capacityMode: VdevCapacityMode;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare metadata: Record<string, unknown> | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare managed: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
  })
  declare sortOrder: number;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.getDataValue('displayName') as string}`;
  }
}
