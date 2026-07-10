'use strict';

const roles = [
  { name: 'admin' },
  { name: 'viewer' },
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
