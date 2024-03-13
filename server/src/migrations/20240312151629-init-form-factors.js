"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "formFactors",
      [
        {
          name: "2.5-inch",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "3.5-inch",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "M.2 2280",
          managed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("formFactors", null, {});
  },
};
