'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Table with UUIDv7 and Auto-Incrementing Display Key
    await queryInterface.createTable('form_factors', {
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
      slot_pitch_mm: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: true, // Nullable to protect edge case form factors without rigid pitches
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
    await queryInterface.addIndex('form_factors', ['name'], {
      name: 'form_factors_name',
      unique: true,
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table safely (Postgres handles sequence cleanup automatically)
    await queryInterface.dropTable('form_factors');
  },
};
