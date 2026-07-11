'use strict';

const path = require('path');

const capacitiesInput = [
  // --- Legacy & Entry Tiers ---
  {
    id: '019f530c-7a11-7f52-af62-94fc72944107',
    name: '120GB',
    value: 120.0,
    unit: 'GB',
  },
  {
    id: '019f530c-7a11-71db-bfaf-a0889fddeec1',
    name: '128GB',
    value: 128.0,
    unit: 'GB',
  },
  {
    id: '019f530c-7a11-7234-8df7-95482eafb864',
    name: '250GB',
    value: 250.0,
    unit: 'GB',
  },
  {
    id: '019f530c-7a11-7a33-9f0a-ac72ccbf7347',
    name: '256GB',
    value: 256.0,
    unit: 'GB',
  },
  {
    id: '019f530c-7a11-77d9-90a4-c558d0f542f1',
    name: '480GB',
    value: 480.0,
    unit: 'GB',
  },
  {
    id: '019f530c-7a11-7470-8cd0-69290e1856ae',
    name: '500GB',
    value: 500.0,
    unit: 'GB',
  },
  {
    id: '019f530c-7a11-7cce-86b1-7c95279c4ba3',
    name: '512GB',
    value: 512.0,
    unit: 'GB',
  },
  {
    id: '019f530c-7a11-7c27-b821-691f8bd85a8d',
    name: '750GB',
    value: 750.0,
    unit: 'GB',
  },

  // --- Enterprise Write-Intensive / Optane Cache Tiers ---
  {
    id: '019f530c-7a11-70da-87eb-f04443fbc8b3',
    name: '800GB',
    value: 800.0,
    unit: 'GB',
  },

  // --- Mainstream Enterprise NVMe & Production HDD Tiers ---
  {
    id: '019f530c-7a11-79f4-af07-309f19e7dff1',
    name: '1TB',
    value: 1.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-722c-b007-e617d7ad4286',
    name: '1.92TB',
    value: 1.92,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-7ed2-a5d7-1178084086b3',
    name: '2TB',
    value: 2.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-7b1d-b0b3-3be6f4e0d366',
    name: '3TB',
    value: 3.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-7c91-b8fc-76fd8a55d077',
    name: '3.84TB',
    value: 3.84,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-7aae-beed-fe356ceb72ab',
    name: '4TB',
    value: 4.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-75ae-a698-da7cb5b799c9',
    name: '6TB',
    value: 6.0,
    unit: 'TB',
  },

  // --- High-Density SSD & Modern Scale-Out HDD Tiers ---
  {
    id: '019f530c-7a11-7643-a339-72c43a9ee328',
    name: '7.68TB',
    value: 7.68,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-78a3-99db-404aa76016f8',
    name: '8TB',
    value: 8.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-7d37-ae18-ef287e442878',
    name: '10TB',
    value: 10.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-76dc-8982-22a498ebe7e0',
    name: '12TB',
    value: 12.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-7c02-b0b6-c3d77481f447',
    name: '14TB',
    value: 14.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-7828-aaa1-45b5cc20f61f',
    name: '15.36TB',
    value: 15.36,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-78ad-9a3e-ec96989bf97e',
    name: '16TB',
    value: 16.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-76f0-aef7-dd204089d43d',
    name: '18TB',
    value: 18.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-7cf5-900d-68fffe0e435b',
    name: '20TB',
    value: 20.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-756f-9386-cb712ac9c382',
    name: '22TB',
    value: 22.0,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-749f-97d9-3e110e950a84',
    name: '24TB',
    value: 24.0,
    unit: 'TB',
  },

  // --- Mass-Density Data Center QLC Flash Tiers ---
  {
    id: '019f530c-7a11-7585-9268-d18d1bed540d',
    name: '30.72TB',
    value: 30.72,
    unit: 'TB',
  },
  {
    id: '019f530c-7a11-73e6-85e9-aa5a8db4ea5c',
    name: '61.44TB',
    value: 61.44,
    unit: 'TB',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const payload = capacitiesInput.map((item) => {
      return {
        ...item,
        managed: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    await queryInterface.bulkInsert('capacities', payload, {});
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'capacities',
      {
        name: {
          [Op.in]: capacitiesInput.map((item) => item.name),
        },
      },
      {}
    );
  },
};
