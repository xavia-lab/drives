'use strict';

// TEST-ONLY fixture for the `racks` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.

const { idMap, required } = require('./lib/lookups');

const racks = [
  {
    id: '019f6a00-0000-7b01-8b01-000000000011',
    name: 'RACK-A01',
    datacenter_code: 'VA-ASH-1',
    total_rack_units: 42,
  },
  {
    id: '019f6a00-0000-7b02-8b02-000000000012',
    name: 'RACK-A02',
    datacenter_code: 'VA-ASH-1',
    total_rack_units: 42,
  },
  {
    id: '019f6a00-0000-7b03-8b03-000000000013',
    name: 'RACK-B01',
    datacenter_code: 'GB-SLO-1',
    total_rack_units: 48,
  },
  {
    id: '019f6a00-0000-7b04-8b04-000000000014',
    name: 'RACK-C01',
    datacenter_code: 'DE-FRA-1',
    total_rack_units: 42,
  },
];

module.exports = {
  async up(queryInterface) {
    const datacenters = await idMap(queryInterface, 'datacenters', 'code');

    await queryInterface.bulkInsert(
      'racks',
      racks.map(({ datacenter_code, ...row }) => ({
        ...row,
        datacenter_id: required(datacenters, datacenter_code, 'datacenters'),
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'racks',
      { id: { [Op.in]: racks.map((item) => item.id) } },
      {},
    );
  },
};
