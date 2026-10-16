import {
  Table,
  Column,
  DataType,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
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
export class Interface extends BaseModel {
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

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.name}`;
  }

  // Associations
  @ForeignKey(() => BusProtocol)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'bus_protocol_id',
  })
  declare busProtocolId: string;

  @BelongsTo(() => BusProtocol, 'bus_protocol_id')
  declare bus_protocol: BusProtocol;
}

// Create a type for creating interfaces (without Sequelize methods)
export type InterfaceCreateAttributes = Pick<
  Interface,
  'name' | 'linkGeneration' | 'throughput' | 'managed' | 'busProtocolId'
>;
