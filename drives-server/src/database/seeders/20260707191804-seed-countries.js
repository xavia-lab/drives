'use strict';

const countries = [
  {
    id: '019f52eb-a75c-790b-819f-6a5dfbcc9bfd',
    code: 'US',
    name: 'United States',
  },
  {
    id: '019f52eb-a75c-7db6-9651-c65c6cc94c12',
    code: 'GB',
    name: 'United Kingdom',
  },
  {
    id: '019f52eb-a75c-776f-83b5-b2169a3735b1',
    code: 'KR',
    name: 'South Korea',
  },
  { id: '019f52eb-a75c-7031-ac9b-7ea279c6b110', code: 'JP', name: 'Japan' },
  { id: '019f52eb-a75c-73d1-920f-ffe96c0962ff', code: 'TW', name: 'Taiwan' }, // Required for ADATA and TEAMGROUP
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('countries', countries.map(country => ({
      ...country,
      managed: true,
      created_at: new Date(),
      updated_at: new Date(),
    })), {});
  },
  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete('countries', { code: { [Op.in]: countries.map(c => c.code) } }, {});
  }
};
