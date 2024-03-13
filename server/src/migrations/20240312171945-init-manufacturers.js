"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "manufacturers",
      [
        {
          name: "Seagate",
          country: "United States",
          phone: "+1 (800) 732-4283",
          website: "https://www.seagate.com/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Westren Digital",
          country: "United States",
          phone: "+1 (800) 275-4932",
          website: "https://www.westerndigital.com/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Westren Digital",
          country: "United Kingdom",
          phone: "+44 (800) 275-49338",
          website: "https://www.westerndigital.com/en-ie/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Toshiba",
          country: "United States",
          phone: "+1 (877) 689-4899",
          email: "TAEC-SPBU-Wty@toshiba.com",
          website: "https://storage.toshiba.com/consumer-hdd/support",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Hitachi",
          country: "United States",
          website: "https://www.hitachi.com/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Samsung",
          country: "United States",
          website: "https://www.samsung.com/us/support/contact/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Intel",
          country: "United States",
          website:
            "https://www.intel.com/content/www/us/en/support/products/35125/memory-and-storage.html",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "ADATA",
          country: "United States",
          website: "https://www.adata.com/us/support/contact-us/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "TEAMGROUP",
          country: "United States",
          website: "https://support.teamgroupinc.com/en/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Max Digital Data",
          country: "United States",
          website: "https://support.teamgroupinc.com/en/",
          managed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("manufacturers", null, {});
  },
};
