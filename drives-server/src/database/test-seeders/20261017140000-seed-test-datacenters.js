'use strict';

// TEST-ONLY fixture for the `datacenters` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.

const { idMap, required } = require('./lib/lookups');

const datacenters = [
  {
    id: '019f6a00-0000-7a01-8a01-000000000001',
    code: 'VA-ASH-1',
    name: 'Ashburn Data Center 1',
    city: 'Ashburn',
    country_code: 'US',
  },
  {
    id: '019f6a00-0000-7a02-8a02-000000000002',
    code: 'GB-SLO-1',
    name: 'Slough Data Center 1',
    city: 'Slough',
    country_code: 'GB',
  },
];

module.exports = {
  async up(queryInterface) {
    const countries = await idMap(queryInterface, 'countries', 'code');

    await queryInterface.bulkInsert(
      'datacenters',
      datacenters.map(({ country_code, ...row }) => ({
        ...row,
        country_id: required(countries, country_code, 'countries'),
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'datacenters',
      { id: { [Op.in]: datacenters.map((item) => item.id) } },
      {},
    );
  },
};
