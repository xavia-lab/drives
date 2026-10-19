'use strict';

// TEST-ONLY fixture for the append-only `server_slot_allocations` ledger
// (drive <-> server-slot MOUNT/UNMOUNT events). Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test` (after physical-drives,
// server-slots and physical-drive-locations).
//
// The current occupant of a slot, and the current slot of a drive, are DERIVED
// from the latest event. `S6XXN0T8BL001` is deliberately mounted then unmounted
// so it stays a free drive while still carrying history; `S6BZNA0T512346`
// migrates to its Slough home (it was moved to GB-SLO-1 by the locations
// seeder) to exercise a valid cross-server mount.

const { idMap, required } = require('./lib/lookups');

// The Keycloak subject the auth-disabled mock operator resolves to, so the
// NOT NULL `user_id` foreign key is satisfied. Published via
// `KeycloakAuthGuard.getMockUser()`.
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

const allocations = [
  // S6BZNA0T512345: seated in ash-storage-01 / HDD Bay 0.
  {
    id: '019f6a90-0000-7a01-8a01-000000000001',
    action_type: 'MOUNT',
    serial_number: 'S6BZNA0T512345',
    server_hostname: 'ash-storage-01',
    slot_label: 'HDD Bay 0',
    timestamp: new Date('2026-07-10T09:00:00.000Z'),
  },
  // S6XXN0T8BL001: was seated in ash-storage-01 / HDD Bay 1, then removed.
  {
    id: '019f6a90-0000-7a02-8a02-000000000002',
    action_type: 'MOUNT',
    serial_number: 'S6XXN0T8BL001',
    server_hostname: 'ash-storage-01',
    slot_label: 'HDD Bay 1',
    timestamp: new Date('2026-07-08T09:00:00.000Z'),
  },
  {
    id: '019f6a90-0000-7a03-8a03-000000000003',
    action_type: 'UNMOUNT',
    serial_number: 'S6XXN0T8BL001',
    server_hostname: 'ash-storage-01',
    slot_label: 'HDD Bay 1',
    timestamp: new Date('2026-07-09T09:00:00.000Z'),
  },
  // S6BZNA0T512346: seated in its Slough home.
  {
    id: '019f6a90-0000-7a04-8a04-000000000004',
    action_type: 'MOUNT',
    serial_number: 'S6BZNA0T512346',
    server_hostname: 'slo-nas-01',
    slot_label: 'HDD Bay 0',
    timestamp: new Date('2026-07-11T09:00:00.000Z'),
  },
];

module.exports = {
  async up(queryInterface) {
    const [userRows] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE id = '${MOCK_USER_ID}';`,
    );
    if (userRows.length === 0) {
      await queryInterface.bulkInsert(
        'users',
        [
          {
            id: MOCK_USER_ID,
            email: 'admin@example.com',
            username: 'admin',
            name: 'Admin User',
            last_login: new Date(),
            is_active: true,
            roles: JSON.stringify(['admin']),
            realm: 'master',
            client_id: 'admin-cli',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { ignoreDuplicates: true },
      );
    }

    const drives = await idMap(queryInterface, 'physical_drives', 'serial_number');

    const [slotRows] = await queryInterface.sequelize.query(
      `SELECT s.id AS id, sv.hostname AS hostname, s.slot_label AS slot_label
         FROM server_slots s
         JOIN physical_servers sv ON sv.id = s.server_id;`,
    );
    const slots = slotRows.reduce((acc, row) => {
      acc[`${row.hostname}/${row.slot_label}`] = row.id;
      return acc;
    }, {});

    await queryInterface.bulkInsert(
      'server_slot_allocations',
      allocations.map(
        ({ serial_number, server_hostname, slot_label, ...row }) => ({
          ...row,
          server_slot_id: required(
            slots,
            `${server_hostname}/${slot_label}`,
            'server_slots',
          ),
          physical_drive_id: required(
            drives,
            serial_number,
            'physical_drives',
          ),
          user_id: MOCK_USER_ID,
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
      'server_slot_allocations',
      { id: { [Op.in]: allocations.map((item) => item.id) } },
      {},
    );
  },
};
