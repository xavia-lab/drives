'use strict';

// TEST-ONLY fixture for the append-only `physical_drive_locations` log.
// Not part of production seeding. Run via
// `pnpm --filter @drives/drives-server seed:test` (after physical-drives and
// datacenters).
//
// A drive's current location is DERIVED from its latest event. `S6BZNA0T512346`
// deliberately carries a full move (VA-ASH-1 -> GB-SLO-1) to exercise the
// timeline; the drives without rows (`WD-SN640-00480A`, ...) are unassigned.

const { idMap, required } = require('./lib/lookups');

const driveLocations = [
  // S6BZNA0T512345: located at Ashburn
  {
    id: '019f6a70-0000-7e70-8e70-000000000001',
    serial_number: 'S6BZNA0T512345',
    datacenter_code: 'VA-ASH-1',
    located_at: new Date('2026-07-01T09:00:00.000Z'),
    notes: 'Initial racking.',
  },
  // S6BZNA0T512346: moved from Ashburn -> Slough
  {
    id: '019f6a70-0000-7e70-8e70-000000000002',
    serial_number: 'S6BZNA0T512346',
    datacenter_code: 'VA-ASH-1',
    located_at: new Date('2026-07-02T08:00:00.000Z'),
    notes: 'Initial racking.',
  },
  {
    id: '019f6a70-0000-7e70-8e70-000000000003',
    serial_number: 'S6BZNA0T512346',
    datacenter_code: 'GB-SLO-1',
    located_at: new Date('2026-07-05T14:30:00.000Z'),
    notes: 'Transferred on capacity rebalance.',
  },
  // S6XXN0T8BL001: located at Ashburn
  {
    id: '019f6a70-0000-7e70-8e70-000000000004',
    serial_number: 'S6XXN0T8BL001',
    datacenter_code: 'VA-ASH-1',
    located_at: new Date('2026-07-03T09:15:00.000Z'),
    notes: null,
  },
];

module.exports = {
  async up(queryInterface) {
    const drives = await idMap(queryInterface, 'physical_drives', 'serial_number');
    const datacenters = await idMap(queryInterface, 'datacenters', 'code');

    await queryInterface.bulkInsert(
      'physical_drive_locations',
      driveLocations.map(
        ({ serial_number, datacenter_code, located_at, ...row }) => ({
          ...row,
          physical_drive_id: required(
            drives,
            serial_number,
            'physical_drives',
          ),
          datacenter_id: required(datacenters, datacenter_code, 'datacenters'),
          located_at,
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
      'physical_drive_locations',
      { id: { [Op.in]: driveLocations.map((item) => item.id) } },
      {},
    );
  },
};
