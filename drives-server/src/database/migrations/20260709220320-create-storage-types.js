'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Table with UUIDv7 and Auto-Incrementing Display Key
    await queryInterface.createTable('storage_types', {
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
        unique: true, // Automatically builds a unique B-Tree index for sorting/filtering
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

    // 2. Add Index
    await queryInterface.addIndex('storage_types', ['name'], {
      name: 'storage_types_name',
      unique: true,
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table safely (Postgres drops the implicitly created sequence automatically)
    await queryInterface.dropTable('storage_types');
  },
};
