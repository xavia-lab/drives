'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('server_slot_allocations', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      server_slot_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match server_slots.id
        allowNull: false,
        references: { model: 'server_slots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      physical_drive_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match physical_drives.id
        allowNull: false,
        references: { model: 'physical_drives', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      action_type: {
        type: Sequelize.ENUM('MOUNT', 'UNMOUNT'),
        allowNull: false, // Purely append-only actions determine layout states
      },
      user_id: {
        type: Sequelize.UUID, // Maintained as UUID (matches Keycloak identity federation)
        allowNull: false,
        references: { model: 'users', key: 'id' }, // Enforces absolute identity accountability
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
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

    // --- High-Performance B-Tree Audit Indexes ---

    // Optimizes tracing the sequential timeline of everything that happened to a specific hardware chassis slot
    await queryInterface.addIndex(
      'server_slot_allocations',
      ['server_slot_id', 'timestamp'],
      {
        name: 'server_slot_allocations_history_idx',
        using: 'btree',
      },
    );

    // Optimizes tracing what slots a single physical drive serial record has inhabited over its lifecycle
    await queryInterface.addIndex(
      'server_slot_allocations',
      ['physical_drive_id', 'timestamp'],
      {
        name: 'physical_drives_allocation_history_idx',
        using: 'btree',
      },
    );

    // Optimizes technician accountability checks and provisioning volume audits per operator user ID
    await queryInterface.addIndex('server_slot_allocations', ['user_id'], {
      name: 'server_slot_allocations_user_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove dependencies (sequences are no longer used)
    await queryInterface.dropTable('server_slot_allocations');

    // Clean up localized PostgreSQL types created exclusively for this ledger state
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_server_slot_allocations_action_type";`,
    );
  },
};
