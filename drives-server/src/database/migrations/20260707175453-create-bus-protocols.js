'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Sequence starting at 2
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "bus_protocols_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create the Table
    await queryInterface.createTable('bus_protocols', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("nextval('bus_protocols_id_seq')"),
      },
      name: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      command_set: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      supports_hot_plug: {
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

    // 3. Create the Composite Unique Index (name, moniker)
    await queryInterface.addIndex('bus_protocols', ['name'], {
      name: 'bus_protocols_name',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bus_protocols');
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "bus_protocols_id_seq";`,
    );
  },
};
