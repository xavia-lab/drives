import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRate } from './entities/exchange-rate.entity';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;
  let exchangeRateModel: { findAll: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    exchangeRateModel = { findAll: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        {
          provide: getModelToken(ExchangeRate),
          useValue: exchangeRateModel,
        },
      ],
    }).compile();

    service = module.get(ExchangeRateService);
  });

  it('keeps only the newest observation per currency', async () => {
    exchangeRateModel.findAll.mockResolvedValue([
      {
        currencyId: 'eur',
        rateToUsd: '1.080000',
        effectiveAt: new Date('2026-10-01T00:00:00.000Z'),
        source: 'seed',
      },
      {
        currencyId: 'eur',
        rateToUsd: '1.060000',
        effectiveAt: new Date('2026-09-01T00:00:00.000Z'),
        source: 'seed',
      },
      {
        currencyId: 'usd',
        rateToUsd: '1.000000',
        effectiveAt: new Date('2026-10-01T00:00:00.000Z'),
        source: null,
      },
    ]);

    const rates = await service.getLatestRates();

    expect(rates.get('eur')).toMatchObject({
      rateToUsd: 1.08,
      source: 'seed',
    });
    expect(rates.get('usd')).toMatchObject({
      rateToUsd: 1,
      source: null,
    });
    expect(rates.size).toBe(2);
    expect(exchangeRateModel.findAll).toHaveBeenCalledWith({
      where: undefined,
      order: [
        ['currencyId', 'ASC'],
        ['effectiveAt', 'DESC'],
        ['displayKey', 'DESC'],
      ],
    });
  });

  it('filters by currency ids when provided', async () => {
    exchangeRateModel.findAll.mockResolvedValue([]);

    const rates = await service.getLatestRates(['eur']);

    expect(rates.size).toBe(0);
    expect(exchangeRateModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { currencyId: { [Op.in]: ['eur'] } },
      }),
    );
  });
});
