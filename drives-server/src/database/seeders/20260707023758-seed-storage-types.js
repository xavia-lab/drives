'use strict';

const data = [
  {
    id: '019f5313-78f4-7e4b-accd-617e39d8a372',
    name: 'Magnetic',
    wear_trackable: false,
  },
  {
    id: '019f5313-78f4-7b82-aad1-c5e81def5e3a',
    name: 'NAND Flash',
    wear_trackable: true,
  },
  {
    id: '019f5313-78f4-772d-b3e7-00657c8972ea',
    name: 'Optane',
    wear_trackable: true,
  },
  // --- New Enterprise CXL/Memory Tiers ---
  {
    id: '019f5313-78f4-7e4c-b9c0-954355a3e544',
    name: 'CXL Memory Expander',
    wear_trackable: false,
  }, // Pure DRAM tier over CXL
  {
    id: '019f5313-78f4-71f6-b6c1-dde5384cea57',
    name: 'Persistent Memory',
    wear_trackable: true,
  }, // Non-volatile memory/NVDIMMs
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
