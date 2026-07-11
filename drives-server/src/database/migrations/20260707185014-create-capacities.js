'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "capacities_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`
    );

    // 2. Create Table
    await queryInterface.createTable('capacities', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"capacities_id_seq"\')'),
      },
      name: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      value: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(8),
        allowNull: false, // e.g., 'GB' or 'TB'
      },
      managed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 3. Create Index for immediate capacity searches
    await queryInterface.addIndex('capacities', ['name'], {
      name: 'capacities_name',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('capacities');
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "capacities_id_seq";`
    );
  },
};
