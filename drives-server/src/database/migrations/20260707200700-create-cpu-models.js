'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the Table with UUIDv7 and Auto-Incrementing Display Key
    await queryInterface.createTable('cpu_models', {
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
      vendor: {
        type: Sequelize.ENUM('AMD', 'INTEL', 'ARM'),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(64),
        allowNull: false, // e.g., 'EPYC 7763' or 'Xeon Gold 6330'
        unique: true,
      },
      physical_cores: {
        type: Sequelize.INTEGER,
        allowNull: false, // e.g., 64, 28
      },
      threads: {
        type: Sequelize.INTEGER,
        allowNull: false, // e.g., 128, 56
      },
      tdp_watts: {
        type: Sequelize.INTEGER,
        allowNull: true, // For data center power consumption auditing
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
  async down(queryInterface) {
    // Drop table safely (Postgres handles internal sequence cleanup automatically)
    await queryInterface.dropTable('cpu_models');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_cpu_models_vendor";`,
    );
  },
};
