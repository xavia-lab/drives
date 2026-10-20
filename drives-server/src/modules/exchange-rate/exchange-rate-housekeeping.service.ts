import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ExchangeRateLockService } from './exchange-rate-lock.service';

const HOUSEKEEPING_LOCK_KEY = 2_026_102_002;
const MS_PER_DAY = 86_400_000;

@Injectable()
export class ExchangeRateHousekeepingService {
  private readonly logger = new Logger(ExchangeRateHousekeepingService.name);
  private running = false;

  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly config: ConfigService,
    private readonly lockService: ExchangeRateLockService,
  ) {}

  /**
   * Deletes observations older than the retention window while always keeping
   * the newest row for each currency.
   */
  async cleanupOldRates(): Promise<number | null> {
    if (!this.isEnabled()) {
      return null;
    }

    if (this.running) {
      this.logger.warn(
        'Skipping exchange-rate housekeeping: a run is already active',
      );
      return null;
    }

    this.running = true;
    const retentionDays = this.config.get<number>(
      'exchangeRate.retentionDays',
      730,
    );
    const cutoff = new Date(Date.now() - retentionDays * MS_PER_DAY);

    try {
      return await this.lockService.runWithLock(
        HOUSEKEEPING_LOCK_KEY,
        (transaction) => this.performCleanup(cutoff, transaction),
      );
    } catch (error) {
      this.logger.error(
        `Exchange-rate housekeeping failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    } finally {
      this.running = false;
    }
  }

  private async performCleanup(
    cutoff: Date,
    transaction: Transaction | undefined,
  ): Promise<number> {
    const deleted = await this.sequelize.query<{ id: string }>(
      `DELETE FROM exchange_rates er
       USING (
         SELECT id,
                ROW_NUMBER() OVER (
                  PARTITION BY currency_id
                  ORDER BY effective_at DESC, display_key DESC
                ) AS rn
         FROM exchange_rates
       ) ranked
       WHERE er.id = ranked.id
         AND ranked.rn > 1
         AND er.effective_at < :cutoff
       RETURNING er.id`,
      {
        replacements: { cutoff },
        type: QueryTypes.SELECT,
        transaction,
      },
    );

    if (deleted.length > 0) {
      this.logger.log(
        `Deleted ${deleted.length} exchange-rate rows older than ${cutoff.toISOString()}`,
      );
    }

    return deleted.length;
  }

  private isEnabled(): boolean {
    return this.config.get<boolean>('exchangeRate.enabled', true);
  }
}
