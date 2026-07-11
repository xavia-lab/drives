'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary Key
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      user_id: {
        type: Sequelize.UUID, // Preserved as UUID to match your Keycloak-federated users table
        allowNull: true, // Nullable to support automated internal system/cron actions
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      action: {
        type: Sequelize.STRING(32),
        allowNull: false, // Refine standard actions: 'create', 'update', 'delete', or custom ones
      },
      resource: {
        type: Sequelize.STRING(64),
        allowNull: false, // Target entity/table moniker (e.g., 'physical_drives', 'storage_pools')
      },
      resource_id: {
        type: Sequelize.STRING(64),
        allowNull: false, // Perfect as-is! Safely supports your newly migrated 36-character UUID strings
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: true, // Holds Refine structural delta maps: { previous: {...}, current: {...} }
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

    // --- Performance Optimization Audit Indexes ---

    // Powers Refine's contextual history tabs on a single specific record page
    await queryInterface.addIndex(
      'audit_logs',
      ['resource', 'resource_id', 'timestamp'],
      {
        name: 'audit_logs_resource_target_idx',
        using: 'btree',
      },
    );

    // Powers global security dashboard tracking filters sorted by execution chronology
    await queryInterface.addIndex('audit_logs', ['timestamp'], {
      name: 'audit_logs_chronological_idx',
      using: 'btree',
    });

    // Powers user-specific activity feed lookups
    await queryInterface.addIndex('audit_logs', ['user_id'], {
      name: 'audit_logs_user_idx',
      using: 'btree',
      where: { user_id: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove dependencies (sequences are no longer used)
    await queryInterface.dropTable('audit_logs');
  },
};
