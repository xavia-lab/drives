'use strict';

const data = [
  {
    id: '019f5900-1a2b-7c3d-8e4f-000000000001',
    name: 'ZFS',
  },
  {
    id: '019f5900-1a2b-7c3d-8e4f-000000000002',
    name: 'BTRFS',
  },
  {
    id: '019f5900-1a2b-7c3d-8e4f-000000000003',
    name: 'CEPH_OSD_POOL',
  },
  {
    id: '019f5900-1a2b-7c3d-8e4f-000000000004',
    name: 'MDRAID',
  },
  {
    id: '019f5900-1a2b-7c3d-8e4f-000000000005',
    name: 'RAW_JBOD',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'pool_types',
      data.map((item) => ({
        ...item,
        managed: true,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'pool_types',
      {
        name: {
          [Op.in]: data.map((item) => item.name),
        },
      },
      {},
    );
  },
};
