'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys + Auto-Incrementing Display Key
    await queryInterface.createTable('drive_lifecycle_events', {
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
      physical_drive_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'physical_drives',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // Only set on RMA_REPLACE: the successor drive shipped by the vendor.
      replacement_physical_drive_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'physical_drives',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Discrete lifecycle action (state is derived from the latest one).
      event_type: {
        type: Sequelize.ENUM(
          'ACQUIRE', // Scanned into inventory (acquisition)
          'PROVISION', // Installed / placed in service
          'DEPROVISION', // Removed from service, returned to inventory
          'DEGRADE', // Bad blocks, high temps or S.M.A.R.T warnings
          'RECOVER', // Repaired / returned to a usable state
          'FAIL', // Drive completely unresponsive / dropped off the bus
          'RMA_INITIATE', // Warranty claim opened
          'RMA_SHIP', // Dispatched to the vendor
          'RMA_APPROVE', // Vendor approved the claim
          'RMA_REJECT', // Vendor rejected the claim, drive comes back
          'RMA_REPLACE', // Replacement drive received (links successor)
          'RMA_CLOSE', // Claim closed without a replacement
          'RETIRE', // Decommissioned, awaiting disposal
          'SCRAP_SHRED', // Physical high-security destruction completed
          'LOST', // Missing / stolen
          'INSPECT', // Informational: inspection recorded (no state change)
          'NOTE', // Informational: free-form note (no state change)
        ),
        allowNull: false,
      },
      event_timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      triggered_by: {
        type: Sequelize.STRING(128),
        allowNull: false, // e.g., 'system_agent_node_42', 'operator_j_smith'
      },
      // The operator who recorded the event (Keycloak subject). Null for
      // automation/agent entries, which rely on triggered_by.
      performed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      context_metadata: {
        type: Sequelize.JSONB,
        allowNull: true, // For capturing raw error dumps, S.M.A.R.T attributes, etc.
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

    // 2. Performance Optimization Indexes for Linear Timelines
    await queryInterface.addIndex(
      'drive_lifecycle_events',
      ['physical_drive_id', 'event_timestamp', 'display_key'],
      {
        name: 'drive_lifecycle_history_idx',
        using: 'btree',
      },
    );

    await queryInterface.addIndex(
      'drive_lifecycle_events',
      ['performed_by_user_id'],
      {
        name: 'drive_lifecycle_performed_by_idx',
        using: 'btree',
      },
    );

    await queryInterface.addIndex(
      'drive_lifecycle_events',
      ['replacement_physical_drive_id'],
      {
        name: 'drive_lifecycle_replacement_drive_idx',
        using: 'btree',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to clear references (Postgres handles internal sequence cleanup automatically)
    await queryInterface.dropTable('drive_lifecycle_events');

    // Drop the specialized enum schema mapping type safely
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_drive_lifecycle_events_event_type";`,
    );
  },
};
