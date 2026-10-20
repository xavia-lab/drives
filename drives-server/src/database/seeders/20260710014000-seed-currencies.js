'use strict';

const currencies = [
  {
    id: '019f52ea-51fb-71f7-b8fa-bb537fe77078',
    name: 'US Dollar',
    code: 'USD',
    symbol: '$',
  },
  {
    id: '019f52ea-51fb-7c8a-9f9b-9e90cb765ce2',
    name: 'Euro',
    code: 'EUR',
    symbol: '€',
  },
  {
    id: '019f52ea-51fb-793d-ac52-3b0833c13d4a',
    name: 'British Pound',
    code: 'GBP',
    symbol: '£',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'currencies',
      currencies.map((item) => ({
        ...item,
        managed: true,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete(
      'currencies',
      {
        [Op.or]: currencies.map((item) => ({
          code: item.code,
        })),
      },
      {},
    );
  },
};
