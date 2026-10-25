'use strict';

// TEST-ONLY fixture for the vdev membership projection + history. Each member
// is selected from the drives currently mounted in the pool host's slots, so
// the topology validation exercised by the API has a consistent fixture.
//
// Run after logical-vdevs and server-slot-allocations.
const { idMap, required } = require('./lib/lookups');

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

const memberships = [
  {
    id: '019f6a80-0000-7e80-8e80-000000000001',
    vdev_id: '019f6a70-0000-7e70-8e70-000000000001',
    pool_name: 'tank-nvme-cache',
    hostname: 'ash-storage-01',
    device_path: '/dev/disk/by-vdev/tank-0',
    event_timestamp: new Date('2026-07-13T09:00:00.000Z'),
  },
  {
    id: '019f6a80-0000-7e80-8e80-000000000003',
    vdev_id: '019f6a70-0000-7e70-8e70-000000000003',
    pool_name: 'btrfs-data-array',
    hostname: 'ash-storage-01',
    device_path: '/dev/disk/by-vdev/btrfs-0',
    event_timestamp: new Date('2026-07-13T09:10:00.000Z'),
  },
  {
    id: '019f6a80-0000-7e80-8e80-000000000004',
    vdev_id: '019f6a70-0000-7e70-8e70-000000000004',
    pool_name: 'raw-jbod-archive',
    hostname: 'slo-nas-01',
    device_path: '/dev/disk/by-vdev/jbod-0',
    event_timestamp: new Date('2026-07-13T09:15:00.000Z'),
  },
  {
    id: '019f6a80-0000-7e80-8e80-000000000005',
    vdev_id: '019f6a70-0000-7e70-8e70-000000000006',
    pool_name: 'zfs-fra-backup',
    hostname: 'fra-storage-01',
    device_path: '/dev/disk/by-vdev/fra-0',
    event_timestamp: new Date('2026-07-13T09:20:00.000Z'),
  },
];

// The UK TrueNAS guest receives nine dedicated drives. They are resolved by
// serial number so the fixture remains stable and the vdev member ordering is
// explicit (RAIDZ2: six drives, RAIDZ1: three drives).
const explicitMemberships = [
  ...[
    'TESTNAS-0001',
    'TESTNAS-0002',
    'TESTNAS-0003',
    'TESTNAS-0004',
    'TESTNAS-0005',
    'TESTNAS-0006',
  ].map((serial_number, index) => ({
    id: `019f6a80-0000-7e80-8e80-${(0x10 + index).toString(16).padStart(12, '0')}`,
    vdev_id: '019f6a70-0000-7e70-8e70-000000000007',
    pool_name: 'truenas-vm-pool',
    serial_number,
    device_path: `/dev/vdev/raidz2-0-${index}`,
    event_timestamp: new Date(
      Date.UTC(2026, 6, 13, 9, 30 + index, 0),
    ),
    member_index: index,
  })),
  ...[
    'TESTNAS-0007',
    'TESTNAS-0008',
    'TESTNAS-0009',
  ].map((serial_number, index) => ({
    id: `019f6a80-0000-7e80-8e80-${(0x20 + index).toString(16).padStart(12, '0')}`,
    vdev_id: '019f6a70-0000-7e70-8e70-000000000008',
    pool_name: 'truenas-raidz1-pool',
    serial_number,
    device_path: `/dev/vdev/raidz1-0-${index}`,
    event_timestamp: new Date(
      Date.UTC(2026, 6, 13, 10, index, 0),
    ),
    member_index: index,
  })),
];

const currentMountedDrive = async (
  queryInterface,
  hostname,
  usedDriveIds,
) => {
  const [eventRows] = await queryInterface.sequelize.query(
    `SELECT DISTINCT ON (a.physical_drive_id)
            a.physical_drive_id AS id, a.action_type AS action_type
       FROM server_slot_allocations a
       JOIN server_slots s ON s.id = a.server_slot_id
       JOIN physical_servers sv ON sv.id = s.server_id
      WHERE sv.hostname = :hostname
      ORDER BY a.physical_drive_id, a.timestamp DESC, a.display_key DESC;`,
    { replacements: { hostname } },
  );
  const mounted = eventRows.filter((row) => row.action_type === 'MOUNT');
  const candidate = mounted.find((row) => !usedDriveIds.has(row.id));
  if (!candidate) {
    throw new Error(
      `Test vdev fixture: no mounted drive available on ${hostname}`,
    );
  }
  usedDriveIds.add(candidate.id);
  return candidate.id;
};

module.exports = {
  async up(queryInterface) {
    const pools = await idMap(queryInterface, 'storage_pools', 'pool_name');
    const drives = await idMap(
      queryInterface,
      'physical_drives',
      'serial_number',
    );
    const used = new Set();
    const rows = [];
    const explicitRows = explicitMemberships.map(
      ({ serial_number, ...membership }) => ({
        ...membership,
        drive_id: required(drives, serial_number, 'physical_drives'),
      }),
    );
    for (const membership of explicitRows) used.add(membership.drive_id);

    for (const membership of memberships) {
      const driveId = await currentMountedDrive(
        queryInterface,
        membership.hostname,
        used,
      );
      rows.push({ ...membership, drive_id: driveId });
    }
    rows.push(...explicitRows);

    await queryInterface.bulkInsert(
      'logical_disks',
      rows.map((row) => ({
        id: row.id,
        logical_vdev_id: row.vdev_id,
        physical_drive_id: row.drive_id,
        os_device_node_path: row.device_path,
        member_role: 'DATA',
        member_index: row.member_index ?? 0,
        group_index: row.group_index ?? null,
        attached_at: row.event_timestamp,
        created_at: row.event_timestamp,
        updated_at: row.event_timestamp,
      })),
      {},
    );

    await queryInterface.bulkInsert(
      'logical_disk_events',
      rows.map((row, index) => ({
        id: `019f6a90-0000-7e90-8e90-${(index + 1)
          .toString(16)
          .padStart(12, '0')}`,
        physical_drive_id: row.drive_id,
        logical_vdev_id: row.vdev_id,
        from_vdev_id: null,
        to_vdev_id: row.vdev_id,
        action: 'ATTACH',
        member_role: 'DATA',
        member_index: row.member_index ?? 0,
        group_index: row.group_index ?? null,
        os_device_node_path: row.device_path,
        event_timestamp: row.event_timestamp,
        performed_by_user_id: MOCK_USER_ID,
        correlation_id: '019f6a90-0000-7e91-8e91-000000000001',
        notes: 'Seeded initial vdev membership.',
        context_metadata: JSON.stringify({
          storagePoolId: required(pools, row.pool_name, 'storage_pools'),
          source: 'test-seed',
        }),
        created_at: row.event_timestamp,
        updated_at: row.event_timestamp,
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    const ids = memberships.map((item) => item.id);
    const eventIds = memberships.map(
      (_item, index) =>
        `019f6a90-0000-7e90-8e90-${(index + 1).toString(16).padStart(12, '0')}`,
    );
    await queryInterface.bulkDelete(
      'logical_disk_events',
      { id: { [Op.in]: eventIds } },
      {},
    );
    await queryInterface.bulkDelete('logical_disks', { id: { [Op.in]: ids } }, {});
  },
};
