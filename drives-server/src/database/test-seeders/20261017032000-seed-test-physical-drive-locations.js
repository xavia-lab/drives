'use strict';

// TEST-ONLY fixture for the append-only `physical_drive_locations` log.
// Not part of production seeding. Run via
// `pnpm --filter @drives/drives-server seed:test` (after physical-drives and
// datacenters).
//
// A drive's current location is DERIVED from its latest event. This fixture
// assigns a datacenter to 55 of the 59 seeded drives (so the slot-assignment
// board has free drives in all datacenters) and deliberately leaves 4 drives
// without any location. The curated events below keep their anchors for the
// downstream slot-allocation fixture; `S6BZNA0T512346` additionally carries a
// full move (VA-ASH-1 -> GB-SLO-1) to exercise the timeline.

const { idMap, required } = require('./lib/lookups');

// Curated events, kept explicit so the slot-allocation fixture keeps its
// anchors. S6BZNA0T512346 migrates from Ashburn to Slough.
const curatedLocations = [
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
  // S6XXN0T8BL001: located at Ashburn (seated then removed in the allocation log)
  {
    id: '019f6a70-0000-7e70-8e70-000000000004',
    serial_number: 'S6XXN0T8BL001',
    datacenter_code: 'VA-ASH-1',
    located_at: new Date('2026-07-03T09:15:00.000Z'),
    notes: null,
  },
  ...Array.from({ length: 9 }, (_, index) => ({
    id: `019f6a70-0000-7e70-8e70-0000000000${(0x05 + index).toString(16).padStart(2, '0')}`,
    serial_number: `TESTNAS-${String(index + 1).padStart(4, '0')}`,
    datacenter_code: 'GB-SLO-1',
    located_at: new Date('2026-07-06T09:00:00.000Z'),
    notes: 'TrueNAS UK backplane drive.',
  })),
];

// The four drives intentionally left without a location. These are the tail of
// the generated `physical-drives` fixture (`TESTDRV-0047..0050`).
const UNASSIGNED_SERIALS = [
  'TESTDRV-0047-PM',
  'TESTDRV-0048-PM',
  'TESTDRV-0049-UL',
  'TESTDRV-0050-EX',
];

// Generated drives rotate across the three datacenters.
const DATACENTERS = ['VA-ASH-1', 'GB-SLO-1', 'DE-FRA-1'];

// The generated events continue the drive fixture's `7fxx` id sequence, so each
// event id is a stable transformation of the drive id (keeping `up`/`down` in
// agreement without hardcoding 40+ literals).
const eventIdForDrive = (driveId) =>
  driveId.replace('019f6a00-0000-7f', '019f6a70-0000-7f');

const loadDrives = async (queryInterface) => {
  const [rows] = await queryInterface.sequelize.query(
    'SELECT id, serial_number FROM physical_drives ORDER BY id;',
  );
  return rows;
};

const buildEvents = (driveRows) => {
  const curatedSerials = new Set(
    curatedLocations.map((event) => event.serial_number),
  );
  const unassignedSerials = new Set(UNASSIGNED_SERIALS);

  const generated = driveRows
    .filter(
      (drive) =>
        !curatedSerials.has(drive.serial_number) &&
        !unassignedSerials.has(drive.serial_number),
    )
    .map((drive, index) => ({
      id: eventIdForDrive(drive.id),
      serial_number: drive.serial_number,
      datacenter_code: DATACENTERS[index % DATACENTERS.length],
      located_at: new Date(Date.UTC(2026, 6, 6, 9, 0, 0) + index * 3600000),
      notes: 'Initial racking.',
    }));

  return [...curatedLocations, ...generated];
};

module.exports = {
  async up(queryInterface) {
    const drives = await idMap(
      queryInterface,
      'physical_drives',
      'serial_number',
    );
    const datacenters = await idMap(queryInterface, 'datacenters', 'code');
    const events = buildEvents(await loadDrives(queryInterface));

    await queryInterface.bulkInsert(
      'physical_drive_locations',
      events.map(({ serial_number, datacenter_code, ...row }) => ({
        ...row,
        physical_drive_id: required(drives, serial_number, 'physical_drives'),
        datacenter_id: required(datacenters, datacenter_code, 'datacenters'),
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    const events = buildEvents(await loadDrives(queryInterface));

    await queryInterface.bulkDelete(
      'physical_drive_locations',
      { id: { [Op.in]: events.map((item) => item.id) } },
      {},
    );
  },
};
