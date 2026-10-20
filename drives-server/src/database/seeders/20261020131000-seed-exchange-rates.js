'use strict';

// Baseline exchange-rate observations so the dashboard has a usable fleet
// value before the periodic market-data worker exists. The application always
// reads the latest effective_at row per currency, so these rows demonstrate
// that history is retained rather than mutating a single value.
const rates = [
  {
    id: '019f6a92-0000-7d00-8d00-000000000001',
    currencyId: '019f52ea-51fb-71f7-b8fa-bb537fe77078', // USD
    rateToUsd: '1.000000',
    effectiveAt: '2026-10-01T00:00:00.000Z',
    source: 'seed',
  },
  {
    id: '019f6a92-0000-7d00-8d00-000000000002',
    currencyId: '019f52ea-51fb-7c8a-9f9b-9e90cb765ce2', // EUR (older)
    rateToUsd: '1.060000',
    effectiveAt: '2026-09-01T00:00:00.000Z',
    source: 'seed',
  },
  {
    id: '019f6a92-0000-7d00-8d00-000000000003',
    currencyId: '019f52ea-51fb-7c8a-9f9b-9e90cb765ce2', // EUR (latest)
    rateToUsd: '1.080000',
    effectiveAt: '2026-10-01T00:00:00.000Z',
    source: 'seed',
  },
  {
    id: '019f6a92-0000-7d00-8d00-000000000004',
    currencyId: '019f52ea-51fb-793d-ac52-3b0833c13d4a', // GBP (older)
    rateToUsd: '1.250000',
    effectiveAt: '2026-09-01T00:00:00.000Z',
    source: 'seed',
  },
  {
    id: '019f6a92-0000-7d00-8d00-000000000005',
    currencyId: '019f52ea-51fb-793d-ac52-3b0833c13d4a', // GBP (latest)
    rateToUsd: '1.270000',
    effectiveAt: '2026-10-01T00:00:00.000Z',
    source: 'seed',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'exchange_rates',
      rates.map((rate) => ({
        id: rate.id,
        currency_id: rate.currencyId,
        rate_to_usd: rate.rateToUsd,
        effective_at: rate.effectiveAt,
        source: rate.source,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete(
      'exchange_rates',
      { id: { [Op.in]: rates.map((rate) => rate.id) } },
      {},
    );
  },
};
