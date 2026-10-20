import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { Currency } from '../../currency/entities/currency.entity';

/**
 * One historical observation of a currency's USD rate.
 *
 * `rateToUsd` is the number of USD per one unit of `currency`. Consumers take
 * the row with the greatest `effectiveAt` for each currency; the table is
 * append-only in practice so historical rates remain available.
 */
@Table({
  tableName: 'exchange_rates',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'exchange_rates_currency_effective_idx',
      fields: ['currency_id', 'effective_at'],
    },
    {
      name: 'exchange_rates_currency_effective_unique_idx',
      unique: true,
      fields: ['currency_id', 'effective_at'],
    },
  ],
})
export class ExchangeRate extends BaseModel {
  @Column({
    type: DataType.DECIMAL(18, 10),
    allowNull: false,
    field: 'rate_to_usd',
  })
  declare rateToUsd: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'effective_at',
  })
  declare effectiveAt: Date;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare source: string | null;

  @ForeignKey(() => Currency)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'currency_id',
  })
  declare currencyId: string;

  @BelongsTo(() => Currency, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare currency: Currency;
}
