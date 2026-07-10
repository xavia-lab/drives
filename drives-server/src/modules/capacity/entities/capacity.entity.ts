import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  Default,
} from 'sequelize-typescript';

import { toBytes } from '../../../lib/utils/human.readable.bytes.converter';

@Table({
  tableName: 'capacities',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'capacities_name',
      unique: true,
      fields: ['name'],
    },
  ],
})
export class Capacity extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.DECIMAL(6, 2),
    allowNull: false,
  })
  declare value: number;

  @Column({
    type: DataType.STRING(8),
    allowNull: false,
  })
  declare unit: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare managed: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  @Column(DataType.VIRTUAL)
  get absoluteCapacity(): number {
    return toBytes(this.value, this.unit);
  }

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.name}`;
  }
}

// Create a type for creating capacities (without Sequelize methods)
export type CapacityCreateAttributes = Pick<
  Capacity,
  'name' | 'value' | 'unit' | 'managed'
>;
