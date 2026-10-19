'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Warranty claim HEADER: immutable identity/details captured when the RMA
    // is opened. Status and lifecycle timestamps are DERIVED from the
    // append-only `warranty_claim_events` log (created in the next migration),
    // never stored here.
    await queryInterface.createTable('warranty_claims', {
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
        type: Sequelize.UUID, // Upgraded to UUID to match physical_drives.id
        allowNull: false,
        references: { model: 'physical_drives', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      triggering_event_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match drive_lifecycle_events.id
        allowNull: true, // Nullable because some warranties might be bulk preventative returns
        references: { model: 'drive_lifecycle_events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      handled_by_vendor_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match vendors.id
        allowNull: false,
        references: { model: 'vendors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      rma_tracking_number: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Performance Optimization Indexes for the header
    await queryInterface.addIndex('warranty_claims', ['triggering_event_id'], {
      name: 'warranty_claims_trigger_event_idx',
      using: 'btree',
    });

    await queryInterface.addIndex('warranty_claims', ['physical_drive_id'], {
      name: 'warranty_claims_physical_drive_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the claim header cleanly to remove structural dependencies
    await queryInterface.dropTable('warranty_claims');
  },
};
