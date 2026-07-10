'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Storage Pools
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "storage_pools_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Table Structure with Consolidated Integer Layouts
    await queryInterface.createTable('storage_pools', {
      id: {
        type: Sequelize.INTEGER, // FIX: Converted from UUID to common INTEGER primary key index
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"storage_pools_id_seq"\')'), // Numerical generator sequencing
      },
      pool_name: {
        type: Sequelize.STRING(64),
        allowNull: false, // e.g., 'tank-nvme-cache', 'btrfs-data-array'
      },
      pool_type: {
        type: Sequelize.ENUM(
          'ZFS',
          'BTRFS',
          'CEPH_OSD_POOL',
          'MDRAID',
          'RAW_JBOD',
        ),
        allowNull: false,
      },
      encryption_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      // --- Topographical Mapping Targets ---
      server_id: {
        type: Sequelize.INTEGER, // Nullable: Only populated if the pool is managed directly by a bare-metal host OS
        allowNull: true,
        references: { model: 'servers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      virtual_server_id: {
        type: Sequelize.INTEGER, // Nullable: Only populated if the pool belongs to a virtualized guest VM/container
        allowNull: true,
        references: { model: 'virtual_servers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    // 3. Database Check Constraint: Enforces that the storage pool is tied to EXACTLY ONE compute resource target
    await queryInterface.sequelize.query(`
      ALTER TABLE "storage_pools" 
      ADD CONSTRAINT "storage_pools_target_exclusivity_check" 
      CHECK (
        (server_id IS NOT NULL AND virtual_server_id IS NOT NULL) = FALSE AND
        (server_id IS NOT NULL OR virtual_server_id IS NOT NULL) = TRUE
      );
    `);

    // --- Performance Optimization Indexes ---

    // Fast scans for isolating storage groupings across physical servers
    await queryInterface.addIndex('storage_pools', ['server_id'], {
      name: 'storage_pools_server_id_idx',
      using: 'btree',
      where: { server_id: { [Sequelize.Op.ne]: null } },
    });

    // Fast scans for isolating storage groupings across virtual nodes
    await queryInterface.addIndex('storage_pools', ['virtual_server_id'], {
      name: 'storage_pools_virtual_server_id_idx',
      using: 'btree',
      where: { virtual_server_id: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove structural dependencies
    await queryInterface.dropTable('storage_pools');

    // Purge the sequential ID generator sequence
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "storage_pools_id_seq";`,
    );

    // Clean up localized PostgreSQL types created exclusively for this table state
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_storage_pools_pool_type";`,
    );
  },
};
