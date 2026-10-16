import { Table, Column, DataType, Default } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

@Table({
  tableName: 'bus_protocols',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'bus_protocols_name',
      unique: true,
      fields: ['name'],
    },
  ],
})
export class BusProtocol extends BaseModel {
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    field: 'command_set',
  })
  declare commandSet: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'supports_hot_plug',
  })
  declare supportsHotPlug: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare managed: boolean;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.name}`;
  }
}

// Create a type for creating bus protocols (without Sequelize methods)
export type BusProtocolCreateAttributes = Pick<
  BusProtocol,
  'name' | 'commandSet' | 'supportsHotPlug' | 'managed'
>;
