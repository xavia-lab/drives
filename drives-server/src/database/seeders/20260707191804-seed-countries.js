'use strict';

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'KR', name: 'South Korea' },
  { code: 'JP', name: 'Japan' },
  { code: 'TW', name: 'Taiwan' } // Required for ADATA and TEAMGROUP
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('countries', countries.map(country => ({
      ...country, managed: true,
        created_at: new Date(),
        updated_at: new Date(),
    })), {});
  },
  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('countries', { code: { [Op.in]: countries.map(c => c.code) } }, {});
  }
};
