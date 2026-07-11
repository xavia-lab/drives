'use strict';

const data = [
  { name: 'SATA', command_set: 'ATA', supports_hot_plug: true },
  { name: 'SAS', command_set: 'SCSI', supports_hot_plug: true },
  { name: 'NVMe', command_set: 'NVMe', supports_hot_plug: true },
  { name: 'CXL', command_set: 'CXL', supports_hot_plug: true },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'bus_protocols',
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
      'bus_protocols',
      {
        [Op.or]: data.map((item) => ({
          name: item.name,
        })),
      },
      {},
    );
  },
};
