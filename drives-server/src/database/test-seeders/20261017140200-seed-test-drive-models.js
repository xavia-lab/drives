'use strict';

// TEST-ONLY fixture for the `drive_models` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.

const { idMap, required } = require('./lib/lookups');

const driveModels = [
  {
    id: '019f6a00-0000-7e01-8e01-000000000031',
    name: 'PM9A3',
    model_number: 'MZQL21T9HCJR-00A07',
    manufacturer_name: 'Samsung Electronics',
    storage_type_name: 'NAND Flash',
    form_factor_name: '2.5-inch SFF',
    interface_name: 'NVMe Gen 4.0 x4',
    capacity_name: '1.92TB',
    max_endurance_tbw: 3504,
  },
  {
    id: '019f6a00-0000-7e02-8e02-000000000032',
    name: 'PM1743',
    model_number: 'MZ3LO3T8HBLA-00A07',
    manufacturer_name: 'Samsung Electronics',
    storage_type_name: 'NAND Flash',
    form_factor_name: 'E3.S 2T 7.5mm',
    interface_name: 'NVMe Gen 5.0 x4',
    capacity_name: '3.84TB',
    max_endurance_tbw: 7000,
  },
  {
    id: '019f6a00-0000-7e03-8e03-000000000033',
    name: 'Ultrastar DC SN640',
    model_number: 'WUS2ETBB48C2P2',
    manufacturer_name: 'Western Digital',
    storage_type_name: 'NAND Flash',
    form_factor_name: '2.5-inch SFF',
    interface_name: 'NVMe Gen 3.0 x4',
    capacity_name: '480GB',
    max_endurance_tbw: 1094,
  },
  {
    id: '019f6a00-0000-7e04-8e04-000000000034',
    name: 'Exos X16',
    model_number: 'ST16000NM001G',
    manufacturer_name: 'Seagate Technology',
    storage_type_name: 'Magnetic',
    form_factor_name: '3.5-inch LFF',
    interface_name: 'SATA III',
    capacity_name: '16TB',
    max_endurance_tbw: null,
  },
  {
    id: '019f6a00-0000-7e05-8e05-000000000035',
    name: 'Exos X20',
    model_number: 'ST20000NM007D',
    manufacturer_name: 'Seagate Technology',
    storage_type_name: 'Magnetic',
    form_factor_name: '3.5-inch LFF',
    interface_name: 'SATA III',
    capacity_name: '20TB',
    max_endurance_tbw: null,
  },
];

module.exports = {
  async up(queryInterface) {
    const vendors = await idMap(queryInterface, 'vendors', 'name');
    const storageTypes = await idMap(queryInterface, 'storage_types', 'name');
    const formFactors = await idMap(queryInterface, 'form_factors', 'name');
    const interfaces = await idMap(queryInterface, 'interfaces', 'name');
    const capacities = await idMap(queryInterface, 'capacities', 'name');

    await queryInterface.bulkInsert(
      'drive_models',
      driveModels.map(
        ({
          manufacturer_name,
          storage_type_name,
          form_factor_name,
          interface_name,
          capacity_name,
          ...row
        }) => ({
          ...row,
          manufacturer_id: required(vendors, manufacturer_name, 'vendors'),
          storage_type_id: required(
            storageTypes,
            storage_type_name,
            'storage_types',
          ),
          form_factor_id: required(
            formFactors,
            form_factor_name,
            'form_factors',
          ),
          interface_id: required(interfaces, interface_name, 'interfaces'),
          capacity_id: required(capacities, capacity_name, 'capacities'),
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
      'drive_models',
      { id: { [Op.in]: driveModels.map((item) => item.id) } },
      {},
    );
  },
};
