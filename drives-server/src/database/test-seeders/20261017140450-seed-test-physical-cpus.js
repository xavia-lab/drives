'use strict';

// TEST-ONLY fixture for the `physical_cpus` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.

const { idMap, required } = require('./lib/lookups');

// Labels follow the app's asset-label convention (MFG-MODEL-PURCHASEDATE-SEQ,
// no capacity segment for CPUs). They are supplied explicitly because
// bulkInsert bypasses the PhysicalCpu @BeforeValidate label hook.
//
// `server_hostname` is the owning server this chip is installed in (or null for
// unassigned inventory). This seeder runs after `physical-servers`, so the
// server rows already exist and the FK is resolved by hostname.
const physicalCpus = [
  {
    id: '019f6a00-0000-7d01-8d01-000000000051',
    cpu_vendor_name: 'AMD',
    cpu_model_name: 'EPYC 7763',
    retailer_vendor_name: 'CDW Logistics',
    currency_code: 'USD',
    server_hostname: 'ash-compute-01',
    label: 'AM-EP-20240315-001',
    serial_number: 'BF2104S00012',
    acquisition_cost: 7890.0,
    purchase_date: '2024-03-15',
    warranty_expiry_date: '2029-03-15',
  },
  {
    id: '019f6a00-0000-7d02-8d02-000000000052',
    cpu_vendor_name: 'AMD',
    cpu_model_name: 'EPYC 7763',
    retailer_vendor_name: 'Amazon US',
    currency_code: 'USD',
    server_hostname: 'ash-compute-01',
    label: 'AM-EP-20240318-001',
    serial_number: 'BF2104S00013',
    acquisition_cost: 7950.0,
    purchase_date: '2024-03-18',
    warranty_expiry_date: '2029-03-18',
  },
  {
    id: '019f6a00-0000-7d03-8d03-000000000053',
    cpu_vendor_name: 'Intel',
    cpu_model_name: 'Xeon Gold 6330',
    retailer_vendor_name: 'CDW Logistics',
    currency_code: 'USD',
    server_hostname: 'ash-storage-01',
    label: 'IN-XE-20240122-001',
    serial_number: 'IN2106S00044',
    acquisition_cost: 4995.0,
    purchase_date: '2024-01-22',
    warranty_expiry_date: '2029-01-22',
  },
  {
    id: '019f6a00-0000-7d04-8d04-000000000054',
    cpu_vendor_name: 'Intel',
    cpu_model_name: 'Xeon Platinum 8480+',
    retailer_vendor_name: 'Amazon US',
    currency_code: 'USD',
    server_hostname: 'slo-nas-01',
    label: 'IN-XE-20230905-001',
    serial_number: 'IN2210S00071',
    acquisition_cost: 11900.0,
    purchase_date: '2023-09-05',
    warranty_expiry_date: '2028-09-05',
  },
  {
    id: '019f6a00-0000-7d05-8d05-000000000055',
    cpu_vendor_name: 'Ampere Computing',
    cpu_model_name: 'Altra Max M128-30',
    retailer_vendor_name: 'CDW Logistics',
    currency_code: 'USD',
    server_hostname: 'slo-compute-01',
    label: 'AM-AL-20250410-001',
    serial_number: 'AC2305S00008',
    acquisition_cost: 6300.0,
    purchase_date: '2025-04-10',
    warranty_expiry_date: '2030-04-10',
  },
];

module.exports = {
  async up(queryInterface) {
    const vendors = await idMap(queryInterface, 'vendors', 'name');
    const currencies = await idMap(queryInterface, 'currencies', 'code');
    const servers = await idMap(queryInterface, 'physical_servers', 'hostname');

    const [modelRows] = await queryInterface.sequelize.query(
      `SELECT cm.id AS id, v.name AS vendor, cm.name AS name
         FROM cpu_models cm
         JOIN vendors v ON v.id = cm.vendor_id;`,
    );
    const cpuModels = modelRows.reduce((acc, row) => {
      acc[`${row.vendor}/${row.name}`] = row.id;
      return acc;
    }, {});

    await queryInterface.bulkInsert(
      'physical_cpus',
      physicalCpus.map(
        ({
          cpu_vendor_name,
          cpu_model_name,
          retailer_vendor_name,
          currency_code,
          server_hostname,
          ...row
        }) => ({
          ...row,
          cpu_model_id: required(
            cpuModels,
            `${cpu_vendor_name}/${cpu_model_name}`,
            'cpu_models',
          ),
          retailer_vendor_id: required(
            vendors,
            retailer_vendor_name,
            'vendors',
          ),
          currency_id: required(currencies, currency_code, 'currencies'),
          physical_server_id: server_hostname
            ? required(servers, server_hostname, 'physical_servers')
            : null,
          created_at: new Date(),
          updated_at: new Date(),
        }),
      ),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'physical_cpus',
      { id: { [Op.in]: physicalCpus.map((item) => item.id) } },
      {},
    );
  },
};
