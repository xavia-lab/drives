'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Warranty Claims
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "warranty_claims_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Table Structure with Unified Integer References
    await queryInterface.createTable('warranty_claims', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal(
          'nextval(\'"warranty_claims_id_seq"\')',
        ), // Numerical generator sequencing
      },
      physical_drive_id: {
        type: Sequelize.INTEGER, // FIX: Converted to INTEGER to match updated physical_drives layout
        allowNull: false,
        references: { model: 'physical_drives', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      triggering_event_id: {
        type: Sequelize.INTEGER, // FIX: Converted to INTEGER to match updated drive_lifecycle_events layout
        allowNull: true, // Nullable because some warranties might be bulk preventative returns
        references: { model: 'drive_lifecycle_events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      handled_by_vendor_id: {
        type: Sequelize.INTEGER,
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

    // 3. Performance Optimization Indexes
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
    // Drop target table cleanly to remove structural dependencies
    await queryInterface.dropTable('warranty_claims');

    // Purge the sequential ID generator
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "warranty_claims_id_seq";`,
    );

    // Drop the specialized enum schema mapping type
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_warranty_claims_claim_status";`,
    );
  },
};
