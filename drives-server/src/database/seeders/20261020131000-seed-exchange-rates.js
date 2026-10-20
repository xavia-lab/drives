'use strict';

const { QueryTypes } = require('sequelize');

// Baseline exchange-rate observations for the system-managed currencies.
// The application always reads the latest effective_at row per currency, so
// EUR/GBP include an older row to exercise that selection logic.
const rates = [
  {
    id: '019f6a92-0000-7d00-8d00-000000000001',
    currencyCode: 'USD',
    rateToUsd: '1.0000000000',
    effectiveAt: '2026-10-01T00:00:00.000Z',
    source: 'seed',
  },
  {
    id: '019f6a92-0000-7d00-8d00-000000000002',
    currencyCode: 'EUR',
    rateToUsd: '1.0600000000',
    effectiveAt: '2026-09-01T00:00:00.000Z',
    source: 'seed',
  },
  {
    id: '019f6a92-0000-7d00-8d00-000000000003',
    currencyCode: 'EUR',
    rateToUsd: '1.0800000000',
    effectiveAt: '2026-10-01T00:00:00.000Z',
    source: 'seed',
  },
  {
    id: '019f6a92-0000-7d00-8d00-000000000004',
    currencyCode: 'GBP',
    rateToUsd: '1.2500000000',
    effectiveAt: '2026-09-01T00:00:00.000Z',
    source: 'seed',
  },
  {
    id: '019f6a92-0000-7d00-8d00-000000000005',
    currencyCode: 'GBP',
    rateToUsd: '1.2700000000',
    effectiveAt: '2026-10-01T00:00:00.000Z',
    source: 'seed',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const codes = [...new Set(rates.map((rate) => rate.currencyCode))];

    // Resolve by business key so the seed keeps working if the currency UUIDs
    // change, and only seed currencies the system still manages.
    const currencies = await queryInterface.sequelize.query(
      `SELECT id, code FROM currencies WHERE managed = true AND code IN (:codes)`,
      {
        type: QueryTypes.SELECT,
        replacements: { codes },
      },
    );
    const currencyIdByCode = new Map(
      currencies.map((currency) => [currency.code, currency.id]),
    );

    const rows = rates
      .map((rate) => {
        const currencyId = currencyIdByCode.get(rate.currencyCode);
        if (!currencyId) return null;

        return {
          id: rate.id,
          currency_id: currencyId,
          rate_to_usd: rate.rateToUsd,
          effective_at: rate.effectiveAt,
          source: rate.source,
          created_at: new Date(),
          updated_at: new Date(),
        };
      })
      .filter(Boolean);

    const missing = codes.filter((code) => !currencyIdByCode.has(code));
    if (missing.length > 0) {
      console.warn(
        `Skipping exchange-rate seed for missing managed currencies: ${missing.join(', ')}`,
      );
    }

    if (rows.length === 0) {
      console.warn('No managed currencies matched the exchange-rate seed.');
      return;
    }

    await queryInterface.bulkInsert('exchange_rates', rows, {
      ignoreDuplicates: true,
    });
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
