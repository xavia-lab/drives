'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Table with UUIDv7 and Auto-Incrementing Display Key
    await queryInterface.createTable('currencies', {
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

    // 2. Create the Unique Indexes
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
    // Drop table safely (Postgres drops the implicitly created sequence automatically)
    await queryInterface.dropTable('currencies');
  },
};
