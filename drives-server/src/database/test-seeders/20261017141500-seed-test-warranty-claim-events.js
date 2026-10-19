'use strict';

// TEST-ONLY fixture for the append-only `warranty_claim_events` log.
// Run via `pnpm --filter @drives/drives-server seed:test`.
//
// Depends on the `warranty_claims` fixture (`…141400`), physical-drives
// (`…140500`) and the mock user. Events reference claims by their
// id-ordered position and replacement drives by their fixture position.
//
// Claim histories (0-based claim index):
//   0  shipped -> approved -> replacement received -> closed  (CLOSED)
//   1  shipped -> rejected                                    (REJECTED)
//   2  shipped -> approved -> closed                          (CLOSED)
//   3  shipped                                                (SHIPPED_TO_VENDOR)
//   4  (no events)                                            (SUBMITTED)
//   5  shipped -> approved                                    (APPROVED)

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';
const TOTAL_DRIVES = 50;
const STEP_MS = 30 * 60 * 1000;
const BASE_TIME = Date.UTC(2026, 1, 1, 9, 0, 0);

const rawEvents = [];
const push = (claim_index, event_type, extra = {}) =>
  rawEvents.push({ claim_index, event_type, ...extra });

push(0, 'SHIPPED_TO_VENDOR', { notes: 'Dispatched via UPS.' });
push(0, 'APPROVED', { notes: 'Vendor accepted the RMA.' });
push(0, 'REPLACEMENT_RECEIVED', { replacement_drive_index: 45 });
push(0, 'CLOSED');

push(1, 'SHIPPED_TO_VENDOR');
push(1, 'REJECTED', { notes: 'Out of warranty coverage.' });

push(2, 'SHIPPED_TO_VENDOR');
push(2, 'APPROVED');
push(2, 'CLOSED', { notes: 'Closed without a replacement (credit issued).' });

push(3, 'SHIPPED_TO_VENDOR');

push(5, 'SHIPPED_TO_VENDOR');
push(5, 'APPROVED');

const events = rawEvents.map((event, index) => ({
  ...event,
  id: `019f6a91-0000-7d00-8d00-${(index + 1).toString(16).padStart(12, '0')}`,
  event_timestamp: new Date(BASE_TIME + index * STEP_MS),
}));

module.exports = {
  async up(queryInterface) {
    // Ensure the mock operator exists (other fixtures also seed it).
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

    const [claimRows] = await queryInterface.sequelize.query(
      'SELECT id FROM warranty_claims ORDER BY id;',
    );
    if (claimRows.length === 0) {
      throw new Error(
        'Test seed prerequisite missing: no warranty claims found. ' +
          'Run "pnpm --filter @drives/drives-server seed:test" in order.',
      );
    }
    const claimIdAt = (index) => claimRows[index].id;

    const [driveRows] = await queryInterface.sequelize.query(
      'SELECT id FROM physical_drives ORDER BY id;',
    );
    if (driveRows.length < TOTAL_DRIVES) {
      throw new Error(
        `Test seed prerequisite missing: expected at least ${TOTAL_DRIVES} ` +
          `physical drives, found ${driveRows.length}.`,
      );
    }
    const driveIdAt = (index) => driveRows[index].id;

    await queryInterface.bulkInsert(
      'warranty_claim_events',
      events.map((event) => ({
        id: event.id,
        warranty_claim_id: claimIdAt(event.claim_index),
        event_type: event.event_type,
        event_timestamp: event.event_timestamp,
        notes: event.notes ?? null,
        performed_by_user_id: MOCK_USER_ID,
        replacement_physical_drive_id:
          event.replacement_drive_index === undefined
            ? null
            : driveIdAt(event.replacement_drive_index),
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'warranty_claim_events',
      { id: { [Op.in]: events.map((event) => event.id) } },
      {},
    );
  },
};
