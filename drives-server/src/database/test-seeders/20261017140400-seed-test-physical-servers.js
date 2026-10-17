'use strict';

// TEST-ONLY fixture for the `physical_servers` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.

const { idMap, required } = require('./lib/lookups');

// Binary byte exponents, mirroring `isBinaryUnit` in
// src/lib/utils/human.readable.bytes.converter.ts. RAM uses MiB/GiB/TiB.
const BINARY_BYTE_EXPONENTS = { MiB: 20, GiB: 30, TiB: 40 };
const toBytes = (value, unit) =>
  Math.round(value * Math.pow(2, BINARY_BYTE_EXPONENTS[unit] ?? 0));

// `rack_key` is `<datacenter code>/<rack name>`, the unique placement of a rack.
const physicalServers = [
  {
    id: '019f6a00-0000-7d11-8d11-000000000051',
    hostname: 'ash-compute-01',
    memory_value: 1024,
    memory_unit: 'GiB',
    cpu_model_name: 'EPYC 7763',
    cpu_count: 2,
    os_name: 'Ubuntu 24.04 LTS',
    rack_key: 'VA-ASH-1/RACK-A01',
    rack_unit_position: 1,
  },
  {
    id: '019f6a00-0000-7d12-8d12-000000000052',
    hostname: 'ash-compute-02',
    memory_value: 768,
    memory_unit: 'GiB',
    cpu_model_name: 'EPYC 9354',
    cpu_count: 2,
    os_name: 'Proxmox VE',
    rack_key: 'VA-ASH-1/RACK-A01',
    rack_unit_position: 2,
  },
  {
    id: '019f6a00-0000-7d13-8d13-000000000053',
    hostname: 'ash-storage-01',
    memory_value: 256,
    memory_unit: 'GiB',
    cpu_model_name: 'Xeon Gold 6330',
    cpu_count: 2,
    os_name: 'Debian 13',
    rack_key: 'VA-ASH-1/RACK-A02',
    rack_unit_position: 1,
  },
  {
    id: '019f6a00-0000-7d14-8d14-000000000054',
    hostname: 'slo-compute-01',
    memory_value: 512,
    memory_unit: 'GiB',
    cpu_model_name: 'Altra Max M128-30',
    cpu_count: 1,
    os_name: 'Ubuntu 24.04 LTS',
    rack_key: 'GB-SLO-1/RACK-B01',
    rack_unit_position: 1,
  },
  {
    id: '019f6a00-0000-7d15-8d15-000000000055',
    hostname: 'slo-nas-01',
    memory_value: 2,
    memory_unit: 'TiB',
    cpu_model_name: 'Xeon Platinum 8480+',
    cpu_count: 2,
    os_name: 'TrueNAS SCALE',
    rack_key: 'GB-SLO-1/RACK-B01',
    rack_unit_position: 2,
  },
];

module.exports = {
  async up(queryInterface) {
    const cpuModels = await idMap(queryInterface, 'cpu_models', 'name');
    const operatingSystems = await idMap(
      queryInterface,
      'operating_systems',
      'name',
    );

    const [rackRows] = await queryInterface.sequelize.query(
      `SELECT r.id AS id, d.code AS datacenter_code, r.name AS name
         FROM racks r
         JOIN datacenters d ON d.id = r.datacenter_id;`,
    );
    const racks = rackRows.reduce((acc, row) => {
      acc[`${row.datacenter_code}/${row.name}`] = row.id;
      return acc;
    }, {});

    await queryInterface.bulkInsert(
      'physical_servers',
      physicalServers.map(({ cpu_model_name, os_name, rack_key, ...row }) => ({
        ...row,
        cpu_model_id: required(cpuModels, cpu_model_name, 'cpu_models'),
        operating_system_id: required(
          operatingSystems,
          os_name,
          'operating_systems',
        ),
        rack_id: required(racks, rack_key, 'racks'),
        // Derived by the PhysicalServer @BeforeSave hook in the app; bulkInsert
        // bypasses model hooks, so compute it here.
        absolute_memory: toBytes(row.memory_value, row.memory_unit),
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'physical_servers',
      { id: { [Op.in]: physicalServers.map((item) => item.id) } },
      {},
    );
  },
};
