import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

/**
 * Serializes the exchange-rate jobs across API replicas.
 *
 * Postgres transaction-scoped advisory locks are released automatically when
 * the transaction ends (including crashes), so a stuck job cannot hold the
 * lock forever. Non-Postgres dialects (unit tests) simply run the work.
 */
@Injectable()
export class ExchangeRateLockService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async runWithLock<T>(
    key: number,
    work: (transaction: Transaction | undefined) => Promise<T>,
  ): Promise<T | null> {
    if (this.sequelize.getDialect() !== 'postgres') {
      return work(undefined);
    }

    return this.sequelize.transaction(async (transaction) => {
      const rows = await this.sequelize.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_xact_lock(:key) AS locked',
        {
          replacements: { key },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      if (!rows[0]?.locked) {
        return null;
      }

      return work(transaction);
    });
  }
}
