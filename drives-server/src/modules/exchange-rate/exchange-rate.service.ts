import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ExchangeRate } from './entities/exchange-rate.entity';

export interface LatestExchangeRate {
  currencyId: string;
  rateToUsd: number;
  effectiveAt: Date;
  source: string | null;
}

@Injectable()
export class ExchangeRateService {
  constructor(
    @InjectModel(ExchangeRate)
    private readonly exchangeRateModel: typeof ExchangeRate,
  ) {}

  /**
   * Returns the most recent USD rate per currency. Consumers must treat a
   * missing entry as "no rate configured" rather than assuming parity.
   */
  async getLatestRates(
    currencyIds?: string[],
  ): Promise<Map<string, LatestExchangeRate>> {
    const where =
      currencyIds && currencyIds.length > 0
        ? { currencyId: { [Op.in]: currencyIds } }
        : undefined;

    const rows = await this.exchangeRateModel.findAll({
      where,
      order: [
        ['currencyId', 'ASC'],
        ['effectiveAt', 'DESC'],
        ['displayKey', 'DESC'],
      ],
    });

    const latest = new Map<string, LatestExchangeRate>();

    for (const row of rows) {
      if (latest.has(row.currencyId)) {
        continue;
      }

      latest.set(row.currencyId, {
        currencyId: row.currencyId,
        rateToUsd: Number(row.rateToUsd),
        effectiveAt: row.effectiveAt,
        source: row.source ?? null,
      });
    }

    return latest;
  }
}
