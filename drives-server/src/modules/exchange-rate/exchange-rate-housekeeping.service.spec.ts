import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExchangeRateHousekeepingService } from './exchange-rate-housekeeping.service';
import { ExchangeRateLockService } from './exchange-rate-lock.service';

describe('ExchangeRateHousekeepingService', () => {
  let service: ExchangeRateHousekeepingService;
  let sequelize: { query: ReturnType<typeof vi.fn> };
  let config: { get: ReturnType<typeof vi.fn> };
  let lockService: { runWithLock: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    sequelize = {
      query: vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]),
    };
    config = {
      get: vi.fn((key: string, fallback: unknown) => {
        const values: Record<string, unknown> = {
          'exchangeRate.enabled': true,
          'exchangeRate.retentionDays': 30,
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
        ExchangeRateHousekeepingService,
        { provide: getConnectionToken(), useValue: sequelize },
        { provide: ConfigService, useValue: config },
        { provide: ExchangeRateLockService, useValue: lockService },
      ],
    }).compile();

    service = module.get(ExchangeRateHousekeepingService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deletes rows older than the retention cutoff while keeping the latest', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T12:00:00.000Z'));

    const deleted = await service.cleanupOldRates();

    expect(deleted).toBe(2);
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('ranked.rn > 1'),
      expect.objectContaining({
        replacements: {
          cutoff: new Date('2026-09-20T12:00:00.000Z'),
        },
      }),
    );
  });

  it('does nothing when disabled', async () => {
    config.get.mockImplementation((key: string, fallback: unknown) =>
      key === 'exchangeRate.enabled' ? false : fallback,
    );

    const deleted = await service.cleanupOldRates();

    expect(deleted).toBeNull();
    expect(sequelize.query).not.toHaveBeenCalled();
  });

  it('logs and swallows cleanup failures', async () => {
    sequelize.query.mockRejectedValue(new Error('db unavailable'));

    const deleted = await service.cleanupOldRates();

    expect(deleted).toBeNull();
  });
});
