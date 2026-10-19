import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalDrive } from './physical-drive.entity';
import { Datacenter } from '../../datacenter/entities/datacenter.entity';

/**
 * Append-only location log describing which datacenter a physical drive sits
 * in over time. There is no `is_active` flag: a drive's current location is
 * derived from its latest row (`located_at DESC, display_key DESC`) and the
 * "one current location" invariant is enforced in the service inside a
 * transaction that locks the owning drive row. Moves append a new row.
 */
@Table({
  tableName: 'physical_drive_locations',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'physical_drive_locations_history_idx',
      using: 'btree',
      fields: ['physical_drive_id', 'located_at'],
    },
    {
      name: 'physical_drive_locations_datacenter_id_idx',
      using: 'btree',
      fields: ['datacenter_id'],
    },
  ],
})
export class PhysicalDriveLocation extends BaseModel {
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'located_at',
  })
  declare locatedAt: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => PhysicalDrive)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'physical_drive_id',
  })
  declare physicalDriveId: string;

  @BelongsTo(() => PhysicalDrive, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare physicalDrive: PhysicalDrive;

  @ForeignKey(() => Datacenter)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'datacenter_id',
  })
  declare datacenterId: string;

  @BelongsTo(() => Datacenter, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare datacenter: Datacenter;
}
