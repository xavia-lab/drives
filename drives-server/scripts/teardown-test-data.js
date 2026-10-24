'use strict';

// Destructive helper for LOCAL/TEST databases only.
//
// `seed:test:undo` is reversible for the fixture rows, but it cannot remove
// rows produced by the app workflows (acquisitions, allocations, claims, ...).
// Those extra rows can keep referencing fixture rows and make the undo fail.
//
// This script truncates every test/application data table in one CASCADE
// statement (Postgres resolves the dependency order), resets the displayKey
// sequences, and clears the test-seeder bookkeeping so `seed:test` runs again.
// Production seed data (vendors, currencies, countries, reference lookups) and
// the users table are preserved.

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../src/database/sequelize.config.js').development;

const TEST_SEEDERS_DIR = path.join(
  __dirname,
  '..',
  'src',
  'database',
  'test-seeders',
);

// Every table populated by the test fixtures (and their logs), plus app data
// derived from them. Reference/lookup tables and users are deliberately absent.
const DATA_TABLES = [
  'audit_logs',
  'warranty_claim_events',
  'warranty_claims',
  'drive_lifecycle_events',
  'server_slot_allocations',
  'physical_drive_locations',
  'storage_pool_hosts',
  'passthrough_slots',
  'logical_disk_events',
  'logical_disks',
  'logical_vdevs',
  'physical_drives',
  'physical_cpus',
  'virtual_servers',
  'server_slots',
  'physical_servers',
  'storage_pools',
  'racks',
  'drive_models',
  'cpu_models',
  'datacenters',
  'physical_drive_media',
  'media',
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to teardown test data while NODE_ENV=production');
  }

  const sequelize = new Sequelize(config);

  try {
    await sequelize.authenticate();
    console.log(
      `Truncating ${DATA_TABLES.length} data tables in "${config.database}"...`,
    );

    await sequelize.query(
      `TRUNCATE TABLE ${DATA_TABLES.map((table) => `"${table}"`).join(
        ', ',
      )} RESTART IDENTITY CASCADE;`,
    );

    // The seeder bookkeeping must forget the test fixtures, otherwise
    // `seed:test` would consider them already executed and skip them.
    const [storageTables] = await sequelize.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'sequelize_data';`,
    );

    if (storageTables.length > 0) {
      const names = fs
        .readdirSync(TEST_SEEDERS_DIR)
        .filter((file) => file.endsWith('.js'));

      if (names.length > 0) {
        await sequelize.query(
          `DELETE FROM "sequelize_data" WHERE name IN (:names);`,
          { replacements: { names } },
        );
        console.log(
          `Cleared ${names.length} test seeder records from sequelize_data.`,
        );
      }
    }

    console.log('Test data teardown complete.');
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
