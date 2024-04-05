"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "interfaces",
      [
        {
          name: "SATA II",
          throughput: "3Gb/s",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "SATA III",
          throughput: "6Gb/s",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "SAS",
          throughput: "12Gb/s",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "NVMe Gen 3.0 x4",
          throughput: "40Gb/s",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "NVMe Gen 4.0 x4",
          throughput: "80Gb/s",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "NVMe Gen 5.0 x4",
          throughput: "160Gb/s",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("interfaces", null, {
      truncate: true,
      cascade: true,
    });
  },
};
