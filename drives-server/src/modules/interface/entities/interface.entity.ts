import {
  Default,
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { BusProtocol } from '../../bus-protocol/entities/bus-protocol.entity';

@Table({
  tableName: 'interfaces',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'interfaces_name',
      unique: true,
      fields: ['name'],
    },
    {
      name: 'interfaces_bus_protocol_id_idx',
      fields: ['bus_protocol_id'],
    },
  ],
})
export class Interface extends Model {
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
    type: DataType.INTEGER,
    allowNull: false,
    field: 'link_generation',
  })
  declare linkGeneration: number;

  @Column({
    type: DataType.DECIMAL(6, 1),
    allowNull: false,
    field: 'throughput_gbps',
  })
  declare throughput: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare managed: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.name}`;
  }

  // Associations
  @ForeignKey(() => BusProtocol)
  @Column({
    allowNull: false,
    field: 'bus_protocol_id',
  })
  declare busProtocolId: number;

  @BelongsTo(() => BusProtocol, 'bus_protocol_id')
  declare bus_protocol: BusProtocol;
}

// Create a type for creating interfaces (without Sequelize methods)
export type InterfaceCreateAttributes = Pick<
  Interface,
  'name' | 'linkGeneration' | 'throughput' | 'managed'
>;
