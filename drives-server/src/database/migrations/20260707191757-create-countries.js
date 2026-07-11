'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Table with UUIDv7
    await queryInterface.createTable('countries', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
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

    // 2. Create the Unique Indexes
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
    // Drop table safely (sequences are no longer used)
    await queryInterface.dropTable('countries');
  },
};
