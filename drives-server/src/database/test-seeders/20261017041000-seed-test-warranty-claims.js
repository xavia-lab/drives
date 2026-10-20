'use strict';

// TEST-ONLY fixture for the `warranty_claims` header table.
// Run via `pnpm --filter @drives/drives-server seed:test`.
//
// Depends on: production `seed:run` (vendors) + test seeders
// physical-drives (`…140500`) and drive-lifecycle-events (`…141300`).
//
// Status/timestamps are NOT stored here — they are derived from the
// `warranty_claim_events` fixture (`…141500`).

const { idMap, required } = require('./lib/lookups');

const TOTAL_DRIVES = 50;

// Claim headers, referencing drives by their id-ordered fixture position.
// `triggering` selects the drive whose RMA_INITIATE lifecycle event (if any)
// triggered the claim.
const claimSpecs = [
  {
    drive_index: 0,
    vendor: 'Samsung Electronics',
    rma_tracking_number: 'RMA-SEED-0001',
    notes: 'SMART reallocated sector growth; drive replaced under warranty.',
    triggering_drive_index: 0,
  },
  {
    drive_index: 1,
    vendor: 'Seagate Technology',
    rma_tracking_number: null,
    notes: 'No-spinup failure; vendor rejected the claim (out of warranty).',
    triggering_drive_index: 1,
  },
  {
    drive_index: 7,
    vendor: 'Western Digital',
    rma_tracking_number: 'RMA-SEED-0003',
    notes: 'Reported failed by the fleet agent. Awaiting vendor RMA approval.',
    triggering_drive_index: null,
  },
  {
    drive_index: 8,
    vendor: 'Solidigm',
    rma_tracking_number: 'RMA-SEED-0004',
    notes: 'Claim opened and shipped to vendor.',
    triggering_drive_index: 8,
  },
  {
    drive_index: 39,
    vendor: 'Samsung Electronics',
    rma_tracking_number: 'RMA-SEED-0005',
    notes: 'Controller fault; drive entered RMA and is awaiting shipment.',
    triggering_drive_index: 39,
  },
  {
    drive_index: 2,
    vendor: 'Seagate Technology',
    rma_tracking_number: 'RMA-SEED-0006',
    notes: 'Scrapped drive claim reconciled with the vendor.',
    triggering_drive_index: null,
  },
];

const claims = claimSpecs.map((spec, index) => ({
  ...spec,
  id: `019f6a90-0000-7d00-8d00-${(index + 1).toString(16).padStart(12, '0')}`,
}));

module.exports = {
  async up(queryInterface) {
    const vendorMap = await idMap(queryInterface, 'vendors');

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

    // Resolve the drive's RMA_INITIATE lifecycle event (may not exist).
    const triggerIdAt = async (driveIndex) => {
      if (driveIndex === null) return null;
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id FROM drive_lifecycle_events ` +
          `WHERE physical_drive_id = '${driveIdAt(driveIndex)}' ` +
          `AND event_type = 'RMA_INITIATE' ` +
          `ORDER BY event_timestamp ASC, display_key ASC LIMIT 1;`,
      );
      return rows.length > 0 ? rows[0].id : null;
    };

    const payload = [];
    for (const claim of claims) {
      payload.push({
        id: claim.id,
        physical_drive_id: driveIdAt(claim.drive_index),
        triggering_event_id: await triggerIdAt(claim.triggering_drive_index),
        handled_by_vendor_id: required(vendorMap, claim.vendor, 'vendors'),
        rma_tracking_number: claim.rma_tracking_number,
        notes: claim.notes,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert('warranty_claims', payload, {});
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'warranty_claims',
      { id: { [Op.in]: claims.map((claim) => claim.id) } },
      {},
    );
  },
};
