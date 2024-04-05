"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "storageTypes",
      [
        {
          name: "Magnetic",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "NAND Flash",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("storageTypes", null, {
      truncate: true,
      cascade: true,
    });
  },
};
