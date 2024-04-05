"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "retailers",
      [
        {
          name: "Amazon",
          country: "United States",
          website: "https://www.amazon.com/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Newegg",
          country: "United States",
          website: "https://www.newegg.com/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Amazon",
          country: "United Kingdom",
          website: "https://www.amazon.co.uk/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Ebuyer",
          country: "United Kingdom",
          website: "https://www.ebuyer.com/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "CCL Computers",
          country: "United Kingdom",
          website: "https://www.cclonline.com/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "retailers",
      {},
      {
        truncate: true,
        cascade: true,
      },
    );
  },
};
