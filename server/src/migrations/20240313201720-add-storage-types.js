"use strict";

const { Op } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "storageTypes",
      [
        {
          name: "Optane",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "storageTypes",
      {
        name: ["Optane"],
      },
      {},
    );
  },
};
