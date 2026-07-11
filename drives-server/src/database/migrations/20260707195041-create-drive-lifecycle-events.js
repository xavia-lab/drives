'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('drive_lifecycle_events', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      physical_drive_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match physical_drives.id
        allowNull: false,
        references: {
          model: 'physical_drives',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      event_type: {
        type: Sequelize.ENUM(
          'RECEIVE', // Asset initially scanned into inventory
          'PROVISION', // Mounted into server bay/slot
          'DEGRADE', // Bad blocks or high temps detected
          'FAIL', // Drive completely unresponsive/dropped off bus
          'RMA_INITIATE', // Sent to warranty claims flow
          'SCRAP_SHRED', // Physical high-security destruction completed
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
      ['physical_drive_id', 'event_timestamp'],
      {
        name: 'drive_lifecycle_history_idx',
        using: 'btree',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to clear references (sequences are no longer used)
    await queryInterface.dropTable('drive_lifecycle_events');

    // Drop the specialized enum schema mapping type safely
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_drive_lifecycle_events_event_type";`,
    );
  },
};
