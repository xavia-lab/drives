'use strict';

// TEST-ONLY fixture for storage-pool vdevs. Profiles come from the production
// `vdev_profiles` seeder. Run via `pnpm --filter @drives/drives-server seed:test`
// after storage-pools.
const { idMap, required } = require('./lib/lookups');

const vdevs = [
  {
    id: '019f6a70-0000-7e70-8e70-000000000001',
    pool_name: 'tank-nvme-cache',
    vdev_name: 'raidz2-0',
    profile_code: 'RAIDZ2',
    vdev_class: 'DATA',
    sort_order: 10,
  },
  {
    id: '019f6a70-0000-7e70-8e70-000000000002',
    pool_name: 'tank-nvme-cache',
    vdev_name: 'log-0',
    profile_code: 'MIRROR',
    vdev_class: 'LOG',
    sort_order: 20,
  },
  {
    id: '019f6a70-0000-7e70-8e70-000000000003',
    pool_name: 'btrfs-data-array',
    vdev_name: 'raid1-0',
    profile_code: 'BTRFS_RAID1',
    vdev_class: 'DATA',
    sort_order: 10,
  },
  {
    id: '019f6a70-0000-7e70-8e70-000000000004',
    pool_name: 'raw-jbod-archive',
    vdev_name: 'jbod-0',
    profile_code: 'JBOD',
    vdev_class: 'DATA',
    sort_order: 10,
  },
  {
    id: '019f6a70-0000-7e70-8e70-000000000005',
    pool_name: 'ceph-osd-k8s',
    vdev_name: 'ec-0',
    profile_code: 'CEPH_EC',
    vdev_class: 'DATA',
    sort_order: 10,
  },
  {
    id: '019f6a70-0000-7e70-8e70-000000000006',
    pool_name: 'zfs-fra-backup',
    vdev_name: 'raidz2-fra-0',
    profile_code: 'RAIDZ2',
    vdev_class: 'DATA',
    sort_order: 10,
  },
];

module.exports = {
  async up(queryInterface) {
    const pools = await idMap(queryInterface, 'storage_pools', 'pool_name');
    const profiles = await idMap(queryInterface, 'vdev_profiles', 'code');

    await queryInterface.bulkInsert(
      'logical_vdevs',
      vdevs.map(({ pool_name, profile_code, ...row }) => ({
        ...row,
        storage_pool_id: required(pools, pool_name, 'storage_pools'),
        redundancy_profile_id: required(profiles, profile_code, 'vdev_profiles'),
        notes: 'Test fixture vdev.',
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete(
      'logical_vdevs',
      { id: { [Op.in]: vdevs.map((item) => item.id) } },
      {},
    );
  },
};
