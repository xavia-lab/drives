'use strict';

// TEST-ONLY fixture for the append-only `server_slot_allocations` ledger
// (drive <-> server-slot MOUNT/UNMOUNT events). Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test` (after physical-drives,
// server-slots and physical-drive-locations).
//
// The current occupant of a slot, and the current slot of a drive, are DERIVED
// from the latest event. Six provisioned drives (two per datacenter) are
// currently mounted, so their lifecycle state stays IN_SERVICE in the lifecycle
// fixture. A seventh VA drive is mounted then unmounted to keep a realistic
// history while ending up unseated (and therefore IN_INVENTORY).

const { idMap, required } = require('./lib/lookups');

// The Keycloak subject the auth-disabled mock operator resolves to, so the
// NOT NULL `user_id` foreign key is satisfied. Published via
// `KeycloakAuthGuard.getMockUser()`.
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

const MOUNT_PLAN = [
  {
    datacenter_code: 'VA-ASH-1',
    server_hostname: 'ash-storage-01',
    slot_label: 'HDD Bay 0',
  },
  {
    datacenter_code: 'VA-ASH-1',
    server_hostname: 'ash-storage-01',
    slot_label: 'HDD Bay 1',
  },
  {
    datacenter_code: 'GB-SLO-1',
    server_hostname: 'slo-nas-01',
    slot_label: 'HDD Bay 0',
  },
  {
    datacenter_code: 'GB-SLO-1',
    server_hostname: 'slo-nas-01',
    slot_label: 'HDD Bay 1',
  },
  {
    datacenter_code: 'DE-FRA-1',
    server_hostname: 'fra-storage-01',
    slot_label: 'HDD Bay 0',
  },
  {
    datacenter_code: 'DE-FRA-1',
    server_hostname: 'fra-storage-01',
    slot_label: 'HDD Bay 1',
  },
];

const HISTORY_PLAN = {
  datacenter_code: 'VA-ASH-1',
  server_hostname: 'ash-storage-01',
  slot_label: 'HDD Bay 2',
};

const MOUNT_BASE_TIME = Date.UTC(2026, 6, 12, 9, 0, 0);
const HISTORY_MOUNT_TIME = Date.UTC(2026, 6, 8, 9, 0, 0);
const HISTORY_UNMOUNT_TIME = Date.UTC(2026, 6, 9, 9, 0, 0);

const allocationId = (index) =>
  `019f6a90-0000-7a01-8a01-${(index + 1).toString(16).padStart(12, '0')}`;

// Select from the provisioned middle of the ordered drive fixture (indices
// 10..39). Those drives always receive PROVISION from the lifecycle seeder, so
// mounting them yields a consistent IN_SERVICE state.
const loadCandidateDrives = async (queryInterface) => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT pd.id AS id,
            pd.serial_number AS serial_number,
            (
              SELECT d.code
              FROM physical_drive_locations l
              JOIN datacenters d ON d.id = l.datacenter_id
              WHERE l.physical_drive_id = pd.id
              ORDER BY l.located_at DESC, l.display_key DESC
              LIMIT 1
            ) AS datacenter_code
       FROM physical_drives pd
       ORDER BY pd.id;`,
  );

  return rows
    .map((row, index) => ({ ...row, fixture_index: index }))
    .filter(
      (row) =>
        row.fixture_index >= 10 &&
        row.fixture_index <= 39 &&
        Boolean(row.datacenter_code),
    );
};

const loadSlots = async (queryInterface) => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT s.id AS id, sv.hostname AS hostname, s.slot_label AS slot_label
       FROM server_slots s
       JOIN physical_servers sv ON sv.id = s.server_id;`,
  );
  return rows.reduce((acc, row) => {
    acc[`${row.hostname}/${row.slot_label}`] = row.id;
    return acc;
  }, {});
};

const buildAllocations = async (queryInterface) => {
  const drives = await loadCandidateDrives(queryInterface);
  const slots = await loadSlots(queryInterface);
  const usedDriveIds = new Set();
  const allocations = [];

  const takeDrive = (datacenterCode) => {
    const candidate = drives.find(
      (drive) =>
        drive.datacenter_code === datacenterCode &&
        !usedDriveIds.has(drive.id),
    );
    if (!candidate) {
      throw new Error(
        `Test seed prerequisite missing: no unseated ${datacenterCode} drive ` +
          'available for the slot-allocation fixture.',
      );
    }
    usedDriveIds.add(candidate.id);
    return candidate;
  };

  MOUNT_PLAN.forEach((plan, index) => {
    const drive = takeDrive(plan.datacenter_code);
    allocations.push({
      id: allocationId(allocations.length),
      action_type: 'MOUNT',
      physical_drive_id: drive.id,
      server_slot_id: required(
        slots,
        `${plan.server_hostname}/${plan.slot_label}`,
        'server_slots',
      ),
      timestamp: new Date(MOUNT_BASE_TIME + index * 60 * 60 * 1000),
    });
  });

  const historyDrive = takeDrive(HISTORY_PLAN.datacenter_code);
  const historySlotId = required(
    slots,
    `${HISTORY_PLAN.server_hostname}/${HISTORY_PLAN.slot_label}`,
    'server_slots',
  );
  allocations.push({
    id: allocationId(allocations.length),
    action_type: 'MOUNT',
    physical_drive_id: historyDrive.id,
    server_slot_id: historySlotId,
    timestamp: new Date(HISTORY_MOUNT_TIME),
  });
  allocations.push({
    id: allocationId(allocations.length),
    action_type: 'UNMOUNT',
    physical_drive_id: historyDrive.id,
    server_slot_id: historySlotId,
    timestamp: new Date(HISTORY_UNMOUNT_TIME),
  });

  return allocations;
};

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

    const allocations = await buildAllocations(queryInterface);

    await queryInterface.bulkInsert(
      'server_slot_allocations',
      allocations.map((allocation) => ({
        ...allocation,
        user_id: MOCK_USER_ID,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    const allocations = await buildAllocations(queryInterface);

    await queryInterface.bulkDelete(
      'server_slot_allocations',
      { id: { [Op.in]: allocations.map((item) => item.id) } },
      {},
    );
  },
};
