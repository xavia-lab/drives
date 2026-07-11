'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('warranty_claims', {
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
      claim_status: {
        type: Sequelize.ENUM(
          'SUBMITTED',
          'SHIPPED_TO_VENDOR',
          'APPROVED',
          'REJECTED',
          'REPLACEMENT_RECEIVED',
        ),
        defaultValue: 'SUBMITTED',
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      submitted_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      resolved_at: {
        type: Sequelize.DATE,
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

    // 2. Performance Optimization Indexes
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
    // Drop target table cleanly to remove structural dependencies (sequences are no longer used)
    await queryInterface.dropTable('warranty_claims');

    // Drop the specialized enum schema mapping type safely
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_warranty_claims_claim_status";`,
    );
  },
};
