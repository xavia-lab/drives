import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Currency } from '../currency/entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { ExchangeRateLockService } from './exchange-rate-lock.service';

const SYNC_LOCK_KEY = 2_026_102_001;
const SUPPORTED_CURRENCIES_TTL_MS = 24 * 60 * 60 * 1000;

interface FrankfurterCurrency {
  iso_code: string;
}

interface FrankfurterRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export interface ExchangeRateSyncSummary {
  date: string;
  stored: number;
  skipped: number;
}

@Injectable()
export class ExchangeRateSyncService {
  private readonly logger = new Logger(ExchangeRateSyncService.name);
  private running = false;
  private supportedCurrencies:
    { codes: Set<string>; fetchedAt: number } | undefined;

  constructor(
    @InjectModel(ExchangeRate)
    private readonly exchangeRateModel: typeof ExchangeRate,
    @InjectModel(Currency)
    private readonly currencyModel: typeof Currency,
    private readonly config: ConfigService,
    private readonly lockService: ExchangeRateLockService,
  ) {}

  /**
   * Fetches the latest Frankfurter observations and upserts them into
   * `exchange_rates`. Errors are logged and swallowed so a scheduled run can
   * never take down the API process.
   */
  async syncRates(): Promise<ExchangeRateSyncSummary | null> {
    if (!this.isEnabled()) {
      return null;
    }

    if (this.running) {
      this.logger.warn('Skipping exchange-rate sync: a run is already active');
      return null;
    }

    this.running = true;
    try {
      // Fetch outside the lock so a slow/unavailable API never holds a DB
      // transaction (and connection) open.
      const prepared = await this.prepareRates();
      if (!prepared) {
        return null;
      }

      const persisted = await this.lockService.runWithLock(
        SYNC_LOCK_KEY,
        (transaction) => this.persistRates(prepared.rows, transaction),
      );

      if (!persisted) {
        this.logger.warn(
          'Skipping exchange-rate persist: another instance holds the lock',
        );
        return null;
      }

      this.logger.log(
        `Stored ${prepared.rows.length} exchange rates effective ${prepared.date}` +
          (prepared.skipped > 0 ? ` (${prepared.skipped} skipped)` : ''),
      );

      return {
        date: prepared.date,
        stored: prepared.rows.length,
        skipped: prepared.skipped,
      };
    } catch (error) {
      this.logger.error(
        `Exchange-rate sync failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    } finally {
      this.running = false;
    }
  }

  private async prepareRates(): Promise<{
    rows: Array<Partial<ExchangeRate>>;
    date: string;
    skipped: number;
  } | null> {
    const currencies = await this.currencyModel.findAll({
      attributes: ['id', 'code'],
    });
    if (currencies.length === 0) {
      this.logger.log('Skipping exchange-rate sync: no currencies configured');
      return null;
    }

    const byCode = new Map(
      currencies.map((currency) => [currency.code.toUpperCase(), currency]),
    );
    const supported = await this.getSupportedCurrencies();
    const requested: string[] = [];
    const unsupported: string[] = [];

    for (const code of byCode.keys()) {
      if (supported.has(code)) {
        requested.push(code);
      } else {
        unsupported.push(code);
      }
    }

    if (unsupported.length > 0) {
      this.logger.warn(
        `Skipping unsupported currencies: ${unsupported.join(', ')}`,
      );
    }

    if (requested.length === 0) {
      return null;
    }

    const rates = await this.fetchRates(requested);
    const now = new Date();
    const rows: Array<Partial<ExchangeRate>> = [];
    let skipped = unsupported.length;
    let effectiveDate = '';

    for (const rate of rates) {
      const code = rate.quote?.toUpperCase();
      const currency = code ? byCode.get(code) : undefined;
      const effectiveAt = new Date(`${rate.date}T00:00:00.000Z`);

      if (
        !currency ||
        typeof rate.rate !== 'number' ||
        !Number.isFinite(rate.rate) ||
        rate.rate <= 0 ||
        Number.isNaN(effectiveAt.getTime())
      ) {
        skipped += 1;
        continue;
      }

      rows.push({
        currencyId: currency.id,
        rateToUsd: code === 'USD' ? 1 : 1 / rate.rate,
        effectiveAt,
        source: 'frankfurter',
        updatedAt: now,
      });

      if (!effectiveDate) {
        effectiveDate = rate.date;
      }
    }

    if (rows.length === 0) {
      this.logger.warn('Frankfurter returned no usable rates');
      return null;
    }

    return { rows, date: effectiveDate, skipped };
  }

  private async persistRates(
    rows: Array<Partial<ExchangeRate>>,
    transaction: Transaction | undefined,
  ): Promise<boolean> {
    await this.exchangeRateModel.bulkCreate(rows, {
      transaction,
      conflictAttributes: ['currencyId', 'effectiveAt'],
      updateOnDuplicate: ['rateToUsd', 'source', 'updatedAt'],
    });
    return true;
  }

  private async getSupportedCurrencies(): Promise<Set<string>> {
    if (
      this.supportedCurrencies &&
      Date.now() - this.supportedCurrencies.fetchedAt <
        SUPPORTED_CURRENCIES_TTL_MS
    ) {
      return this.supportedCurrencies.codes;
    }

    const currencies =
      await this.requestJson<FrankfurterCurrency[]>('/v2/currencies');
    const codes = new Set(currencies.map((entry) => entry.iso_code));
    this.supportedCurrencies = { codes, fetchedAt: Date.now() };
    return codes;
  }

  private async fetchRates(codes: string[]): Promise<FrankfurterRate[]> {
    const quotes = codes.map((code) => code.toLowerCase()).join(',');
    return this.requestJson<FrankfurterRate[]>(
      `/v2/rates?base=USD&quotes=${encodeURIComponent(quotes)}`,
    );
  }

  private async requestJson<T>(path: string): Promise<T> {
    const apiUrl = this.config.get<string>(
      'exchangeRate.apiUrl',
      'https://api.frankfurter.dev',
    );
    const timeoutMs = this.config.get<number>('exchangeRate.timeoutMs', 10_000);
    const url = `${apiUrl}${path}`;

    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          throw new Error(
            `Frankfurter request failed: ${response.status} ${response.statusText}`,
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await this.delay(500 * 2 ** (attempt - 1));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private isEnabled(): boolean {
    return this.config.get<boolean>('exchangeRate.enabled', true);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
