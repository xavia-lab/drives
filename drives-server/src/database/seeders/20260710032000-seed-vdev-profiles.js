'use strict';

const profiles = [
  { code: 'SINGLE', display_name: 'Single disk', technology: 'GENERIC', min_members: 1, max_members: 1, parity_members: 0, mirror_copies: 1, capacity_mode: 'SUM', sort_order: 10 },
  { code: 'JBOD', display_name: 'JBOD / concatenated', technology: 'GENERIC', min_members: 1, parity_members: 0, mirror_copies: 1, capacity_mode: 'SUM', sort_order: 20 },
  { code: 'STRIPE', display_name: 'Stripe / RAID 0', technology: 'GENERIC', min_members: 2, parity_members: 0, mirror_copies: 1, capacity_mode: 'SUM', sort_order: 30 },
  { code: 'MIRROR', display_name: 'Mirror', technology: 'GENERIC', min_members: 2, parity_members: 0, mirror_copies: 2, capacity_mode: 'MIN', sort_order: 40 },
  { code: 'RAID0', display_name: 'RAID 0', technology: 'MDRAID', min_members: 2, parity_members: 0, mirror_copies: 1, capacity_mode: 'SUM', sort_order: 50 },
  { code: 'RAID1', display_name: 'RAID 1', technology: 'MDRAID', min_members: 2, parity_members: 0, mirror_copies: 2, capacity_mode: 'MIN', sort_order: 60 },
  { code: 'RAID5', display_name: 'RAID 5', technology: 'MDRAID', min_members: 3, parity_members: 1, mirror_copies: 1, capacity_mode: 'PARITY', sort_order: 70 },
  { code: 'RAID6', display_name: 'RAID 6', technology: 'MDRAID', min_members: 4, parity_members: 2, mirror_copies: 1, capacity_mode: 'PARITY', sort_order: 80 },
  { code: 'RAID10', display_name: 'RAID 10', technology: 'MDRAID', min_members: 4, parity_members: 0, mirror_copies: 2, stripe_width: 2, capacity_mode: 'MIRROR_GROUPS', sort_order: 90 },
  { code: 'RAIDZ1', display_name: 'RAIDZ1', technology: 'ZFS', min_members: 3, parity_members: 1, mirror_copies: 1, capacity_mode: 'PARITY', sort_order: 100 },
  { code: 'RAIDZ2', display_name: 'RAIDZ2', technology: 'ZFS', min_members: 4, parity_members: 2, mirror_copies: 1, capacity_mode: 'PARITY', sort_order: 110 },
  { code: 'RAIDZ3', display_name: 'RAIDZ3', technology: 'ZFS', min_members: 5, parity_members: 3, mirror_copies: 1, capacity_mode: 'PARITY', sort_order: 120 },
  { code: 'BTRFS_RAID1', display_name: 'Btrfs RAID1', technology: 'BTRFS', min_members: 2, parity_members: 0, mirror_copies: 2, capacity_mode: 'MIN', sort_order: 130 },
  { code: 'BTRFS_RAID10', display_name: 'Btrfs RAID10', technology: 'BTRFS', min_members: 4, parity_members: 0, mirror_copies: 2, stripe_width: 2, capacity_mode: 'MIRROR_GROUPS', sort_order: 140 },
  { code: 'CEPH_EC', display_name: 'Ceph erasure coded', technology: 'CEPH', min_members: 3, parity_members: 1, mirror_copies: 1, capacity_mode: 'PARITY', metadata: { k: 2, m: 1 }, sort_order: 150 },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'vdev_profiles',
      profiles.map((profile) => ({
        ...profile,
        metadata: profile.metadata
          ? JSON.stringify(profile.metadata)
          : null,
        managed: true,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('vdev_profiles', {
      code: { [Op.in]: profiles.map((profile) => profile.code) },
    });
  },
};
