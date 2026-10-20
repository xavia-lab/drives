import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExchangeRateSyncService } from './exchange-rate-sync.service';
import { ExchangeRateLockService } from './exchange-rate-lock.service';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { Currency } from '../currency/entities/currency.entity';

const CURRENCIES = [
  { id: 'usd-id', code: 'USD' },
  { id: 'eur-id', code: 'EUR' },
  { id: 'gbp-id', code: 'GBP' },
  { id: 'zzz-id', code: 'ZZZ' },
];

const jsonResponse = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Internal Server Error',
  json: () => Promise.resolve(body),
});

describe('ExchangeRateSyncService', () => {
  let service: ExchangeRateSyncService;
  let exchangeRateModel: { bulkCreate: ReturnType<typeof vi.fn> };
  let currencyModel: { findAll: ReturnType<typeof vi.fn> };
  let config: { get: ReturnType<typeof vi.fn> };
  let lockService: { runWithLock: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    exchangeRateModel = { bulkCreate: vi.fn() };
    currencyModel = { findAll: vi.fn().mockResolvedValue(CURRENCIES) };
    config = {
      get: vi.fn((key: string, fallback: unknown) => {
        const values: Record<string, unknown> = {
          'exchangeRate.enabled': true,
          'exchangeRate.apiUrl': 'https://api.frankfurter.dev',
          'exchangeRate.timeoutMs': 5_000,
        };
        return values[key] ?? fallback;
      }),
    };
    lockService = {
      runWithLock: vi.fn((_key: number, work: (tx: unknown) => unknown) =>
        work(undefined),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateSyncService,
        {
          provide: getModelToken(ExchangeRate),
          useValue: exchangeRateModel,
        },
        { provide: getModelToken(Currency), useValue: currencyModel },
        { provide: ConfigService, useValue: config },
        { provide: ExchangeRateLockService, useValue: lockService },
      ],
    }).compile();

    service = module.get(ExchangeRateSyncService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('stores USD-normalized rates and skips unsupported currencies', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          { iso_code: 'USD' },
          { iso_code: 'EUR' },
          { iso_code: 'GBP' },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            date: '2026-10-20',
            base: 'USD',
            quote: 'USD',
            rate: 1,
          },
          {
            date: '2026-10-20',
            base: 'USD',
            quote: 'EUR',
            rate: 0.8,
          },
          {
            date: '2026-10-20',
            base: 'USD',
            quote: 'GBP',
            rate: 0.5,
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    const summary = await service.syncRates();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.frankfurter.dev/v2/currencies',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.frankfurter.dev/v2/rates?base=USD&quotes=usd%2Ceur%2Cgbp',
      expect.any(Object),
    );
    expect(summary).toEqual({ date: '2026-10-20', stored: 3, skipped: 1 });

    const [rows, options] = exchangeRateModel.bulkCreate.mock.calls[0] as [
      Array<Record<string, unknown>>,
      Record<string, unknown>,
    ];
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      currencyId: 'usd-id',
      rateToUsd: 1,
      source: 'frankfurter',
    });
    expect(rows[1]).toMatchObject({
      currencyId: 'eur-id',
      rateToUsd: 1.25,
      source: 'frankfurter',
    });
    expect(rows[2]).toMatchObject({
      currencyId: 'gbp-id',
      rateToUsd: 2,
      source: 'frankfurter',
    });
    expect(rows[0].effectiveAt).toEqual(new Date('2026-10-20T00:00:00.000Z'));
    expect(options).toMatchObject({
      updateOnDuplicate: ['rateToUsd', 'source', 'updatedAt'],
    });
  });

  it('does nothing when the scheduler is disabled', async () => {
    config.get.mockImplementation((key: string, fallback: unknown) =>
      key === 'exchangeRate.enabled' ? false : fallback,
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const summary = await service.syncRates();

    expect(summary).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(exchangeRateModel.bulkCreate).not.toHaveBeenCalled();
  });

  it('logs and swallows upstream failures without writing rows', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, false, 500));
    vi.stubGlobal('fetch', fetchMock);

    const promise = service.syncRates();
    await vi.runAllTimersAsync();
    const summary = await promise;

    expect(summary).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(exchangeRateModel.bulkCreate).not.toHaveBeenCalled();
  });
});
