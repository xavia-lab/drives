'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the Table with UUIDv7 and Auto-Incrementing Display Key
    await queryInterface.createTable('roles', {
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
        unique: true,
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
  },

  async down(queryInterface, Sequelize) {
    // Drop the table safely (Postgres handles sequence cleanup automatically)
    await queryInterface.dropTable('roles');
  },
};
