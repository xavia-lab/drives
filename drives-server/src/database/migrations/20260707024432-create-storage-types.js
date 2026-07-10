'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Sequence
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "storage_types_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create the Table
    await queryInterface.createTable('storage_types', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"storage_types_id_seq"\')'),
      },
      name: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      wear_trackable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addIndex('storage_types', ['name'], {
      name: 'storage_types_name',
      unique: true,
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table first, then the sequence
    await queryInterface.dropTable('storage_types');
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "storage_types_id_seq";`,
    );
  },
};
