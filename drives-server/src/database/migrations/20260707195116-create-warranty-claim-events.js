'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Warranty claim TRACKING LOG: an append-only stream of events describing
    // what happened to a claim. The derived `WarrantyClaimStatus` is computed
    // from the latest state-changing event, never stored on the header.
    await queryInterface.createTable('warranty_claim_events', {
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
        unique: true,
      },
      warranty_claim_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'warranty_claims', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      event_type: {
        type: Sequelize.ENUM(
          'SHIPPED_TO_VENDOR', // Dispatched to the vendor
          'APPROVED', // Vendor approved the claim
          'REJECTED', // Vendor rejected the claim
          'REPLACEMENT_RECEIVED', // Successor drive received (links replacement)
          'CLOSED', // Claim closed
          'NOTE', // Informational: free-form note (no status change)
        ),
        allowNull: false,
      },
      event_timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // The operator who recorded the event (Keycloak subject). Null for
      // automation/agent entries.
      performed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Only set on REPLACEMENT_RECEIVED: the successor drive shipped back.
      replacement_physical_drive_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'physical_drives', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    // Performance Optimization Indexes for the tracking log
    await queryInterface.addIndex(
      'warranty_claim_events',
      ['warranty_claim_id', 'event_timestamp', 'display_key'],
      {
        name: 'warranty_claim_events_history_idx',
        using: 'btree',
      },
    );

    await queryInterface.addIndex(
      'warranty_claim_events',
      ['performed_by_user_id'],
      {
        name: 'warranty_claim_events_performed_by_idx',
        using: 'btree',
      },
    );

    await queryInterface.addIndex(
      'warranty_claim_events',
      ['replacement_physical_drive_id'],
      {
        name: 'warranty_claim_events_replacement_drive_idx',
        using: 'btree',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('warranty_claim_events');

    // Drop the specialized enum schema mapping type safely
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_warranty_claim_events_event_type";`,
    );
  },
};
