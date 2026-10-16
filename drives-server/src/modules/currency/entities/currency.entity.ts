import { Table, Column, DataType, Default } from 'sequelize-typescript';

import { BaseModel } from '../../../shared/entities/base.model';

@Table({
  tableName: 'currencies',
  timestamps: true,
  underscored: true,
  indexes: [
    { name: 'currencies_name', unique: true, fields: ['name'] },
    { name: 'currencies_code', unique: true, fields: ['code'] },
  ],
})
export class Currency extends BaseModel {
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
  })
  declare code: string;

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
  })
  declare symbol: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare managed: boolean;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.code}`;
  }
}

export type CurrencyCreateAttributes = Pick<
  Currency,
  'name' | 'code' | 'symbol' | 'managed'
>;
