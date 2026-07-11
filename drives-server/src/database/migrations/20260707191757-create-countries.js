'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Sequence
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "countries_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;`,
    );

    // 2. Create the Table
    await queryInterface.createTable('countries', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("nextval('countries_id_seq')"),
      },
      code: {
        type: Sequelize.STRING(2), // ISO Alpha-2 code (e.g., 'US', 'GB')
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(64),
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

    await queryInterface.addIndex('countries', ['name'], {
      unique: true,
      name: 'countries_name',
      using: 'btree',
    });
    await queryInterface.addIndex('countries', ['code'], {
      unique: true,
      name: 'countries_code',
      using: 'btree',
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('countries');
        await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "countries_id_seq";`,
    );
  },
};
