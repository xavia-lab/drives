'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table with UUIDv7
    await queryInterface.createTable('capacities', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
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

    // 2. Create Index for immediate capacity searches
    await queryInterface.addIndex('capacities', ['name'], {
      name: 'capacities_name',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table safely (sequences are no longer used)
    await queryInterface.dropTable('capacities');
  },
};
