'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Audit Log Records
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "audit_logs_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Table Structure with Refine-Compatible Layout
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"audit_logs_id_seq"\')'),
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
        allowNull: false, // Stores the record primary key (cast to string to safely support both int/uuid schemas)
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
    await queryInterface.dropTable('audit_logs');
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "audit_logs_id_seq";`,
    );
  },
};
