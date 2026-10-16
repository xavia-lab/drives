import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { Datacenter } from '../../datacenter/entities/datacenter.entity';

@Table({
  tableName: 'racks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'racks_datacenter_id_idx',
      using: 'btree',
      fields: ['datacenter_id'],
    },
    {
      name: 'racks_datacenter_name_unique_idx',
      unique: true,
      fields: ['datacenter_id', 'name'],
    },
  ],
})
export class Rack extends BaseModel {
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 42,
  })
  declare totalRackUnits: number;

  // --- Foreign Keys and Associations ---

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
