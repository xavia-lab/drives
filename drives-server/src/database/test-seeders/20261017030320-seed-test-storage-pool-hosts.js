'use strict';

// TEST-ONLY fixture for the append-only `storage_pool_hosts` IMPORT/EXPORT log.
// Not part of production seeding. Run via
// `pnpm --filter @drives/drives-server seed:test` (after storage-pools).
//
// A pool's current host is DERIVED from its latest event: IMPORT => attached,
// EXPORT => detached. `mdraid-scratch` deliberately carries a full move
// (ash-storage-01 -> ash-compute-01) to exercise the timeline, and
// `truenas-vm-pool` has no events at all (detached).

const { idMap, required } = require('./lib/lookups');

const HOST = {
  physical: 'physical_server_id',
  virtual: 'virtual_server_id',
};

const poolHostEvents = [
  // tank-nvme-cache: attached to ash-storage-01
  {
    id: '019f6a60-0000-7e60-8e60-000000000001',
    pool_name: 'tank-nvme-cache',
    host_kind: HOST.physical,
    host_name: 'ash-storage-01',
    event_type: 'IMPORT',
    event_timestamp: new Date('2026-07-01T09:00:00.000Z'),
    notes: 'Initial pool import.',
  },
  // btrfs-data-array: attached to ash-storage-01
  {
    id: '019f6a60-0000-7e60-8e60-000000000002',
    pool_name: 'btrfs-data-array',
    host_kind: HOST.physical,
    host_name: 'ash-storage-01',
    event_type: 'IMPORT',
    event_timestamp: new Date('2026-07-01T09:05:00.000Z'),
    notes: 'Initial pool import.',
  },
  // mdraid-scratch: moved from ash-storage-01 -> ash-compute-01
  {
    id: '019f6a60-0000-7e60-8e60-000000000003',
    pool_name: 'mdraid-scratch',
    host_kind: HOST.physical,
    host_name: 'ash-storage-01',
    event_type: 'IMPORT',
    event_timestamp: new Date('2026-07-02T08:00:00.000Z'),
    notes: 'Temporary staging import.',
  },
  {
    id: '019f6a60-0000-7e60-8e60-000000000004',
    pool_name: 'mdraid-scratch',
    host_kind: HOST.physical,
    host_name: 'ash-storage-01',
    event_type: 'EXPORT',
    event_timestamp: new Date('2026-07-02T10:00:00.000Z'),
    notes: 'Detached for migration.',
  },
  {
    id: '019f6a60-0000-7e60-8e60-000000000005',
    pool_name: 'mdraid-scratch',
    host_kind: HOST.physical,
    host_name: 'ash-compute-01',
    event_type: 'IMPORT',
    event_timestamp: new Date('2026-07-02T11:00:00.000Z'),
    notes: 'Imported onto destination host.',
  },
  // raw-jbod-archive: attached to slo-nas-01
  {
    id: '019f6a60-0000-7e60-8e60-000000000006',
    pool_name: 'raw-jbod-archive',
    host_kind: HOST.physical,
    host_name: 'slo-nas-01',
    event_type: 'IMPORT',
    event_timestamp: new Date('2026-07-03T09:00:00.000Z'),
    notes: 'Initial pool import.',
  },
  // ceph-osd-k8s: attached to the vm-k8s-01 guest
  {
    id: '019f6a60-0000-7e60-8e60-000000000007',
    pool_name: 'ceph-osd-k8s',
    host_kind: HOST.virtual,
    host_name: 'vm-k8s-01',
    event_type: 'IMPORT',
    event_timestamp: new Date('2026-07-04T09:00:00.000Z'),
    notes: 'Guest pool import.',
  },
  // zfs-fra-backup: attached to the Frankfurt storage head
  {
    id: '019f6a60-0000-7e60-8e60-000000000008',
    pool_name: 'zfs-fra-backup',
    host_kind: HOST.physical,
    host_name: 'fra-storage-01',
    event_type: 'IMPORT',
    event_timestamp: new Date('2026-07-06T09:00:00.000Z'),
    notes: 'Initial backup pool import.',
  },
  // ceph-osd-fra: attached to the Frankfurt backup guest
  {
    id: '019f6a60-0000-7e60-8e60-000000000009',
    pool_name: 'ceph-osd-fra',
    host_kind: HOST.virtual,
    host_name: 'vm-backup-01',
    event_type: 'IMPORT',
    event_timestamp: new Date('2026-07-07T09:00:00.000Z'),
    notes: 'Guest pool import.',
  },
];

module.exports = {
  async up(queryInterface) {
    const pools = await idMap(queryInterface, 'storage_pools', 'pool_name');
    const servers = await idMap(queryInterface, 'physical_servers', 'hostname');
    const virtualServers = await idMap(
      queryInterface,
      'virtual_servers',
      'hostname',
    );

    await queryInterface.bulkInsert(
      'storage_pool_hosts',
      poolHostEvents.map(
        ({ pool_name, host_kind, host_name, event_timestamp, ...row }) => ({
          ...row,
          storage_pool_id: required(pools, pool_name, 'storage_pools'),
          physical_server_id:
            host_kind === HOST.physical
              ? required(servers, host_name, 'physical_servers')
              : null,
          virtual_server_id:
            host_kind === HOST.virtual
              ? required(virtualServers, host_name, 'virtual_servers')
              : null,
          event_timestamp,
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
      'storage_pool_hosts',
      { id: { [Op.in]: poolHostEvents.map((item) => item.id) } },
      {},
    );
  },
};
