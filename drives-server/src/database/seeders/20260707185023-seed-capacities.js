'use strict';

const path = require('path');

const capacitiesInput = [
  // --- Legacy & Entry Tiers ---
  { name: '120GB', value: 120.0, unit: 'GB' },
  { name: '128GB', value: 128.0, unit: 'GB' },
  { name: '250GB', value: 250.0, unit: 'GB' },
  { name: '256GB', value: 256.0, unit: 'GB' },
  { name: '480GB', value: 480.0, unit: 'GB' },
  { name: '500GB', value: 500.0, unit: 'GB' },
  { name: '512GB', value: 512.0, unit: 'GB' },
  { name: '750GB', value: 750.0, unit: 'GB' },
  
  // --- Enterprise Write-Intensive / Optane Cache Tiers ---
  { name: '800GB', value: 800.0, unit: 'GB' },

  // --- Mainstream Enterprise NVMe & Production HDD Tiers ---
  { name: '1TB', value: 1.0, unit: 'TB' },
  { name: '1.92TB', value: 1.92, unit: 'TB' },
  { name: '2TB', value: 2.0, unit: 'TB' },
  { name: '3TB', value: 3.0, unit: 'TB' },
  { name: '3.84TB', value: 3.84, unit: 'TB' },
  { name: '4TB', value: 4.0, unit: 'TB' },
  { name: '6TB', value: 6.0, unit: 'TB' },
  
  // --- High-Density SSD & Modern Scale-Out HDD Tiers ---
  { name: '7.68TB', value: 7.68, unit: 'TB' },
  { name: '8TB', value: 8.0, unit: 'TB' },
  { name: '10TB', value: 10.0, unit: 'TB' },
  { name: '12TB', value: 12.0, unit: 'TB' },
  { name: '14TB', value: 14.0, unit: 'TB' },
  { name: '15.36TB', value: 15.36, unit: 'TB' },
  { name: '16TB', value: 16.0, unit: 'TB' },
  { name: '18TB', value: 18.0, unit: 'TB' },
  { name: '20TB', value: 20.0, unit: 'TB' },
  { name: '22TB', value: 22.0, unit: 'TB' },
  { name: '24TB', value: 24.0, unit: 'TB' },

  // --- Mass-Density Data Center QLC Flash Tiers ---
  { name: '30.72TB', value: 30.72, unit: 'TB' },
  { name: '61.44TB', value: 61.44, unit: 'TB' }
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const payload = capacitiesInput.map((item) => {
      return {
        name: item.name,
        value: item.value,
        unit: item.unit,
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
