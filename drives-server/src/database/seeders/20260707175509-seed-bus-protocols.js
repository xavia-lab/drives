'use strict';

const data = [
  {
    id: '019f52be-9ac9-73ba-9332-bab8dbe0d98a',
    name: 'SATA',
    command_set: 'ATA',
    supports_hot_plug: true,
  },
  {
    id: '019f52be-9ac9-740f-af4b-c562b641c1f3',
    name: 'SAS',
    command_set: 'SCSI',
    supports_hot_plug: true,
  },
  {
    id: '019f52be-9ac9-7e26-9690-0269e8133283',
    name: 'NVMe',
    command_set: 'NVMe',
    supports_hot_plug: true,
  },
  {
    id: '019f52be-9ac9-78c6-90e0-b440d25eb894',
    name: 'CXL',
    command_set: 'CXL',
    supports_hot_plug: true,
  },
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
