'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Table with UUIDv7 and Auto-Incrementing Display Key
    await queryInterface.createTable('bus_protocols', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      display_key: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        unique: true, // Automatically builds a unique index for sorting/filtering
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

    // 2. Create the Unique Index
    await queryInterface.addIndex('bus_protocols', ['name'], {
      name: 'bus_protocols_name',
      unique: true,
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table safely (Postgres handles sequence cleanup automatically)
    await queryInterface.dropTable('bus_protocols');
  },
};
