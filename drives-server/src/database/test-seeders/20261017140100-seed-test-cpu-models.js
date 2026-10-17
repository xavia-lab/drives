'use strict';

// TEST-ONLY fixture for the `cpu_models` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.

const { idMap, required } = require('./lib/lookups');

const cpuModels = [
  {
    id: '019f6a00-0000-7c01-8c01-000000000021',
    vendor_name: 'AMD',
    architecture: 'X86_64',
    name: 'EPYC 7763',
    physical_cores: 64,
    threads: 128,
    tdp_watts: 280,
  },
  {
    id: '019f6a00-0000-7c02-8c02-000000000022',
    vendor_name: 'AMD',
    architecture: 'X86_64',
    name: 'EPYC 9354',
    physical_cores: 32,
    threads: 64,
    tdp_watts: 280,
  },
  {
    id: '019f6a00-0000-7c03-8c03-000000000023',
    vendor_name: 'Intel',
    architecture: 'X86_64',
    name: 'Xeon Gold 6330',
    physical_cores: 28,
    threads: 56,
    tdp_watts: 205,
  },
  {
    id: '019f6a00-0000-7c04-8c04-000000000024',
    vendor_name: 'Intel',
    architecture: 'X86_64',
    name: 'Xeon Platinum 8480+',
    physical_cores: 56,
    threads: 112,
    tdp_watts: 350,
  },
  {
    id: '019f6a00-0000-7c05-8c05-000000000025',
    vendor_name: 'Ampere Computing',
    architecture: 'ARM64',
    name: 'Altra Max M128-30',
    physical_cores: 128,
    threads: 128,
    tdp_watts: 250,
  },
];

module.exports = {
  async up(queryInterface) {
    const vendors = await idMap(queryInterface, 'vendors', 'name');

    await queryInterface.bulkInsert(
      'cpu_models',
      cpuModels.map(({ vendor_name, ...row }) => ({
        ...row,
        vendor_id: required(vendors, vendor_name, 'vendors'),
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'cpu_models',
      { id: { [Op.in]: cpuModels.map((item) => item.id) } },
      {},
    );
  },
};
