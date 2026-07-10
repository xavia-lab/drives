'use strict';

const data = [
  { name: 'Magnetic', wear_trackable: false },
  { name: 'NAND Flash', wear_trackable: true },
  { name: 'Optane', wear_trackable: true },
  // --- New Enterprise CXL/Memory Tiers ---
  { name: 'CXL Memory Expander', wear_trackable: false }, // Pure DRAM tier over CXL
  { name: 'Persistent Memory', wear_trackable: true }    // Non-volatile memory/NVDIMMs
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'storage_types',
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
      'storage_types',
      {
        name: {
          [Op.in]: data.map((item) => item.name)
        }
      },
      {},
    );
  },
};
