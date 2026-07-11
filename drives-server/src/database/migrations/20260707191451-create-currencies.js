'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Sequence
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "currencies_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;`,
    );

    // 2. Create the Table
    await queryInterface.createTable('currencies', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("nextval('currencies_id_seq')"),
      },
      name: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(3),
        allowNull: false,
      },
      symbol: {
        type: Sequelize.STRING(3),
        allowNull: false,
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
    await queryInterface.addIndex('currencies', ['name'], {
      unique: true,
      name: 'currencies_name',
      using: 'btree',
    });
    await queryInterface.addIndex('currencies', ['code'], {
      unique: true,
      name: 'currencies_code',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table, then the sequence
    await queryInterface.dropTable('currencies');
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "currencies_id_seq";`,
    );
  },
};
