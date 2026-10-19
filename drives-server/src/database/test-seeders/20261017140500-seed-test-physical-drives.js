'use strict';

// TEST-ONLY fixture for the `physical_drives` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.
//
// Produces a 50-drive dataset: the six curated drives below (whose IDs/serials
// are referenced by the locations and slot-allocation fixtures) plus 44
// deterministically generated drives so list/show screens and the slot
// assignment board have enough data to exercise paging, filtering and drag/drop.
//
// Labels follow the app's asset-label convention
// (MFG-MODEL-CAPACITYUNIT-PURCHASEDATE-SEQ). They are supplied explicitly
// because bulkInsert bypasses the PhysicalDrive @BeforeValidate label hook.

const { idMap, required } = require('./lib/lookups');

// The reference drive models seeded by 20261017140200-seed-test-drive-models.js.
// `mfg`/`model`/`capacity` only shape the generated label; the FK is resolved by
// `storage_manufacturer` + `drive_model_number`.
const DRIVE_MODEL_POOL = [
  {
    storage_manufacturer: 'Samsung Electronics',
    drive_model_number: 'MZQL21T9HCJR-00A07',
    mfg: 'SA',
    model: 'PM9A',
    capacity: '01.9TB',
    base_cost: 219.0,
    wwn_prefix: '5002538c81',
  },
  {
    storage_manufacturer: 'Samsung Electronics',
    drive_model_number: 'MZ3LO3T8HBLA-00A07',
    mfg: 'SA',
    model: 'PM17',
    capacity: '03.8TB',
    base_cost: 749.99,
    wwn_prefix: '5002538c82',
  },
  {
    storage_manufacturer: 'Western Digital',
    drive_model_number: 'WUS2ETBB48C2P2',
    mfg: 'WE',
    model: 'UL',
    capacity: '0480GB',
    base_cost: 89.99,
    wwn_prefix: '5000cca2a1',
  },
  {
    storage_manufacturer: 'Seagate Technology',
    drive_model_number: 'ST16000NM001G',
    mfg: 'SE',
    model: 'EX',
    capacity: '0016TB',
    base_cost: 289.0,
    wwn_prefix: null,
  },
  {
    storage_manufacturer: 'Seagate Technology',
    drive_model_number: 'ST20000NM007D',
    mfg: 'SE',
    model: 'EX',
    capacity: '0020TB',
    base_cost: 349.0,
    wwn_prefix: null,
  },
];

const RETAILERS = ['CDW Logistics', 'Amazon US'];

const pad = (value, length) => String(value).padStart(length, '0');
const hex = (value, length) =>
  value.toString(16).toUpperCase().padStart(length, '0');
const formatDate = (date) => date.toISOString().slice(0, 10);

// Builds the generated tail of the dataset. IDs continue the curated `7fxx`
// sequence (`7f07`..`7f32`); purchase dates step forward so every generated
// label is unique.
function generateDrives(count, startIndex) {
  const sequenceByPrefix = {};

  return Array.from({ length: count }, (_, offset) => {
    const index = startIndex + offset;
    const model = DRIVE_MODEL_POOL[offset % DRIVE_MODEL_POOL.length];

    const id = `019f6a00-0000-7f${hex(index, 2)}-8f${hex(index, 2)}-0000000000${hex(0x40 + index, 2)}`;

    const purchase = new Date(
      Date.UTC(2023, 0, 15) + offset * 11 * 24 * 60 * 60 * 1000,
    );
    const warranty = new Date(purchase);
    warranty.setUTCFullYear(warranty.getUTCFullYear() + 5);
    const purchaseDate = formatDate(purchase);

    const prefix = `${model.mfg}-${model.model}-${model.capacity}-${purchaseDate.replace(/-/g, '')}`;
    sequenceByPrefix[prefix] = (sequenceByPrefix[prefix] ?? 0) + 1;

    return {
      id,
      storage_manufacturer: model.storage_manufacturer,
      drive_model_number: model.drive_model_number,
      retailer_vendor_name: RETAILERS[offset % RETAILERS.length],
      label: `${prefix}-${pad(sequenceByPrefix[prefix], 3)}`,
      serial_number: `TESTDRV-${pad(index, 4)}-${model.model}`,
      worldwide_name_wwn: model.wwn_prefix
        ? `${model.wwn_prefix}${hex(offset + 1, 6)}`
        : null,
      acquisition_cost: Number((model.base_cost + offset * 1.5).toFixed(2)),
      currency_code: 'USD',
      purchase_date: purchaseDate,
      warranty_expiry_date: formatDate(warranty),
    };
  });
}

const curatedDrives = [
  {
    id: '019f6a00-0000-7f01-8f01-000000000041',
    storage_manufacturer: 'Samsung Electronics',
    drive_model_number: 'MZQL21T9HCJR-00A07',
    retailer_vendor_name: 'CDW Logistics',
    label: 'SA-PM9A-01.9TB-20240212-001',
    serial_number: 'S6BZNA0T512345',
    worldwide_name_wwn: '5002538c8101a2b3',
    acquisition_cost: 219.0,
    currency_code: 'USD',
    purchase_date: '2024-02-12',
    warranty_expiry_date: '2029-02-12',
  },
  {
    id: '019f6a00-0000-7f02-8f02-000000000042',
    storage_manufacturer: 'Samsung Electronics',
    drive_model_number: 'MZQL21T9HCJR-00A07',
    retailer_vendor_name: 'Amazon US',
    label: 'SA-PM9A-01.9TB-20240301-001',
    serial_number: 'S6BZNA0T512346',
    worldwide_name_wwn: '5002538c8101a2b4',
    acquisition_cost: 225.5,
    currency_code: 'USD',
    purchase_date: '2024-03-01',
    warranty_expiry_date: '2029-03-01',
  },
  {
    id: '019f6a00-0000-7f03-8f03-000000000043',
    storage_manufacturer: 'Samsung Electronics',
    drive_model_number: 'MZ3LO3T8HBLA-00A07',
    retailer_vendor_name: 'CDW Logistics',
    label: 'SA-PM17-03.8TB-20240620-001',
    serial_number: 'S6XXN0T8BL001',
    worldwide_name_wwn: '5002538c8200c1d1',
    acquisition_cost: 749.99,
    currency_code: 'USD',
    purchase_date: '2024-06-20',
    warranty_expiry_date: '2029-06-20',
  },
  {
    id: '019f6a00-0000-7f04-8f04-000000000044',
    storage_manufacturer: 'Western Digital',
    drive_model_number: 'WUS2ETBB48C2P2',
    retailer_vendor_name: 'CDW Logistics',
    label: 'WE-UL-0480GB-20231105-001',
    serial_number: 'WD-SN640-00480A',
    worldwide_name_wwn: '5000cca2a1b2c3d4',
    acquisition_cost: 89.99,
    currency_code: 'USD',
    purchase_date: '2023-11-05',
    warranty_expiry_date: '2028-11-05',
  },
  {
    id: '019f6a00-0000-7f05-8f05-000000000045',
    storage_manufacturer: 'Seagate Technology',
    drive_model_number: 'ST16000NM001G',
    retailer_vendor_name: 'Amazon US',
    label: 'SE-EX-0016TB-20230518-001',
    serial_number: 'ST16000NM001G-2KK103',
    worldwide_name_wwn: null,
    acquisition_cost: 289.0,
    currency_code: 'USD',
    purchase_date: '2023-05-18',
    warranty_expiry_date: '2028-05-18',
  },
  {
    id: '019f6a00-0000-7f06-8f06-000000000046',
    storage_manufacturer: 'Seagate Technology',
    drive_model_number: 'ST20000NM007D',
    retailer_vendor_name: 'CDW Logistics',
    label: 'SE-EX-0020TB-20240122-001',
    serial_number: 'ST20000NM007D-3TJ103',
    worldwide_name_wwn: null,
    acquisition_cost: 349.0,
    currency_code: 'USD',
    purchase_date: '2024-01-22',
    warranty_expiry_date: '2029-01-22',
  },
];

const TOTAL_DRIVES = 50;
const physicalDrives = [
  ...curatedDrives,
  ...generateDrives(
    TOTAL_DRIVES - curatedDrives.length,
    curatedDrives.length + 1,
  ),
];

module.exports = {
  async up(queryInterface) {
    const vendors = await idMap(queryInterface, 'vendors', 'name');
    const currencies = await idMap(queryInterface, 'currencies', 'code');

    const [modelRows] = await queryInterface.sequelize.query(
      `SELECT sm.id AS id, v.name AS manufacturer, sm.model_number AS model_number
         FROM drive_models sm
         JOIN vendors v ON v.id = sm.manufacturer_id;`,
    );
    const driveModels = modelRows.reduce((acc, row) => {
      acc[`${row.manufacturer}/${row.model_number}`] = row.id;
      return acc;
    }, {});

    await queryInterface.bulkInsert(
      'physical_drives',
      physicalDrives.map(
        ({
          storage_manufacturer,
          drive_model_number,
          retailer_vendor_name,
          currency_code,
          ...row
        }) => ({
          ...row,
          drive_model_id: required(
            driveModels,
            `${storage_manufacturer}/${drive_model_number}`,
            'drive_models',
          ),
          retailer_vendor_id: required(
            vendors,
            retailer_vendor_name,
            'vendors',
          ),
          currency_id: required(currencies, currency_code, 'currencies'),
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
      'physical_drives',
      { id: { [Op.in]: physicalDrives.map((item) => item.id) } },
      {},
    );
  },
};
