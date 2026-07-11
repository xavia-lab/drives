'use strict';

const roles = [
  { id: '019f52b6-47c7-74b4-b9dd-734a5356dde4', name: 'admin' },
  { id: '019f52b6-b6c9-7d97-9c2f-30e6d489ec3d', name: 'viewer' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'roles',
      roles.map((item) => ({
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
      'roles',
      {
        [Op.or]: roles.map((item) => ({
          name: item.name,
        })),
      },
      {},
    );
  },
};
