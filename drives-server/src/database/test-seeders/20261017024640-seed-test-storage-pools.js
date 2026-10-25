'use strict';

// TEST-ONLY fixture for the `storage_pools` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.
//
// Pools are host-agnostic here: which host a pool is attached to (and when) is
// recorded by the append-only `storage_pool_hosts` log seeded in
// 20261017030320-seed-test-storage-pool-hosts.js. Pool types come from the
// production `pool_types` lookup (20260710023000-seed-pool-types.js), which must
// be seeded first.

const { idMap, required } = require('./lib/lookups');

const storagePools = [
  {
    id: '019f6a50-0000-7e50-8e50-000000000001',
    pool_name: 'tank-nvme-cache',
    pool_type_name: 'ZFS',
    encryption_enabled: true,
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000002',
    pool_name: 'btrfs-data-array',
    pool_type_name: 'BTRFS',
    encryption_enabled: false,
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000003',
    pool_name: 'mdraid-scratch',
    pool_type_name: 'MDRAID',
    encryption_enabled: false,
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000004',
    pool_name: 'raw-jbod-archive',
    pool_type_name: 'RAW_JBOD',
    encryption_enabled: true,
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000005',
    pool_name: 'ceph-osd-k8s',
    pool_type_name: 'CEPH_OSD_POOL',
    encryption_enabled: true,
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000006',
    pool_name: 'truenas-vm-pool',
    pool_type_name: 'ZFS',
    encryption_enabled: false,
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000007',
    pool_name: 'zfs-fra-backup',
    pool_type_name: 'ZFS',
    encryption_enabled: true,
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000008',
    pool_name: 'ceph-osd-fra',
    pool_type_name: 'CEPH_OSD_POOL',
    encryption_enabled: true,
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000009',
    pool_name: 'truenas-raidz1-pool',
    pool_type_name: 'ZFS',
    encryption_enabled: false,
  },
];

module.exports = {
  async up(queryInterface) {
    const poolTypes = await idMap(queryInterface, 'pool_types', 'name');

    await queryInterface.bulkInsert(
      'storage_pools',
      storagePools.map(({ pool_type_name, ...row }) => ({
        ...row,
        pool_type_id: required(poolTypes, pool_type_name, 'pool_types'),
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'storage_pools',
      { id: { [Op.in]: storagePools.map((item) => item.id) } },
      {},
    );
  },
};
