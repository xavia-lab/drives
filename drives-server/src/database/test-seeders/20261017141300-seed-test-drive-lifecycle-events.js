'use strict';

// TEST-ONLY fixture for the append-only `drive_lifecycle_events` log.
// Run via `pnpm --filter @drives/drives-server seed:test` (after physical-drives).
//
// Every drive receives an ACQUIRE event, most are provisioned, and a handful
// carry richer histories (degrade -> fail -> RMA replacement, scrap, retire,
// lost) so the derived lifecycle state and timeline can be exercised.
//
// Events reference drives by their position in the id-ordered physical drives
// fixture, so this file stays decoupled from serial numbers.

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';
const TOTAL_DRIVES = 50;
const STEP_MS = 30 * 60 * 1000;

const BASE_TIME = Date.UTC(2026, 0, 1, 8, 0, 0);

// --- Event plan -------------------------------------------------------------
// Layout (0-based drive indexes):
//   0     full RMA replacement cycle -> REPLACED (replaced by drive 48)
//   1     fail -> RMA rejected -> FAILED
//   2     fail -> retire -> scrap -> SCRAPPED
//   3     lost -> LOST
//   4     degrade -> recover -> IN_INVENTORY
//   5     deprovision -> IN_INVENTORY
//   6     retire -> RETIRED
//   7     fail -> FAILED
//   8     fail -> RMA initiate -> IN_RMA
//   9     degrade -> DEGRADED
//   10-39 provisioned -> IN_SERVICE
//   40-49 acquired only -> RECEIVED
// ----------------------------------------------------------------------------

const rawEvents = [];
const push = (drive_index, event_type, extra = {}) =>
  rawEvents.push({ drive_index, event_type, ...extra });

for (let i = 0; i < TOTAL_DRIVES; i += 1) push(i, 'ACQUIRE');
for (let i = 0; i < 40; i += 1) push(i, 'PROVISION');

push(0, 'DEGRADE', { context_metadata: { reason: 'SMART warnings' } });
push(0, 'FAIL', {
  context_metadata: { failure_code: 'SMART_REALLOCATED_SECTOR_COUNT' },
});
push(0, 'RMA_INITIATE', {
  context_metadata: { rma_tracking_number: 'RMA-SEED-0001' },
});
push(0, 'RMA_SHIP');
push(0, 'RMA_APPROVE');
push(0, 'RMA_REPLACE', { replacement_drive_index: 48 });

push(1, 'FAIL', { context_metadata: { failure_code: 'NO_SPINUP' } });
push(1, 'RMA_INITIATE');
push(1, 'RMA_REJECT', {
  context_metadata: { rejection_reason: 'Out of warranty' },
});

push(2, 'FAIL');
push(2, 'RETIRE');
push(2, 'SCRAP_SHRED', { context_metadata: { certificate: 'CERT-SEED-0003' } });

push(3, 'LOST', { context_metadata: { reported_by: 'operator_j_smith' } });
push(4, 'DEGRADE');
push(4, 'RECOVER', { context_metadata: { resolution: 'Firmware reflash' } });
push(5, 'DEPROVISION');
push(6, 'RETIRE');
push(7, 'FAIL');
push(8, 'FAIL');
push(8, 'RMA_INITIATE');
push(9, 'DEGRADE');

// Assign deterministic ids and ascending timestamps: event N happens STEP_MS
// after the previous one, so each drive's history is monotonic.
const events = rawEvents.map((event, index) => ({
  ...event,
  id: `019f6a80-0000-7c00-8c00-${(index + 1).toString(16).padStart(12, '0')}`,
  event_timestamp: new Date(BASE_TIME + index * STEP_MS),
}));

module.exports = {
  async up(queryInterface) {
    // Ensure the mock operator exists (the slot allocation fixture also seeds
    // it; this keeps the file runnable on its own).
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

    const [driveRows] = await queryInterface.sequelize.query(
      'SELECT id FROM physical_drives ORDER BY id;',
    );
    if (driveRows.length < TOTAL_DRIVES) {
      throw new Error(
        `Test seed prerequisite missing: expected at least ${TOTAL_DRIVES} ` +
          `physical drives, found ${driveRows.length}. ` +
          'Run "pnpm --filter @drives/drives-server seed:test" in order.',
      );
    }
    const driveIdAt = (index) => driveRows[index].id;

    await queryInterface.bulkInsert(
      'drive_lifecycle_events',
      events.map((event) => ({
        id: event.id,
        physical_drive_id: driveIdAt(event.drive_index),
        replacement_physical_drive_id:
          event.replacement_drive_index === undefined
            ? null
            : driveIdAt(event.replacement_drive_index),
        event_type: event.event_type,
        event_timestamp: event.event_timestamp,
        triggered_by: 'seed-fixture',
        performed_by_user_id: MOCK_USER_ID,
        context_metadata: event.context_metadata
          ? JSON.stringify(event.context_metadata)
          : null,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'drive_lifecycle_events',
      { id: { [Op.in]: events.map((event) => event.id) } },
      {},
    );
  },
};
