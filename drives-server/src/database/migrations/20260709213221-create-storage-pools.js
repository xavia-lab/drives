'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys + Auto-Incrementing Display Key
    await queryInterface.createTable('storage_pools', {
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
      pool_name: {
        type: Sequelize.STRING(64),
        allowNull: false, // e.g., 'tank-nvme-cache', 'btrfs-data-array'
      },
      pool_type_id: {
        type: Sequelize.UUID, // Upgraded to lookup FK to match pool_types.id
        allowNull: false,
        references: { model: 'pool_types', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      encryption_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      // --- Topographical Mapping Targets ---
      server_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match physical_servers.id
        allowNull: true, // Nullable: Only populated if the pool is managed directly by a bare-metal host OS
        references: { model: 'physical_servers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      virtual_server_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match virtual_servers.id
        allowNull: true, // Nullable: Only populated if the pool belongs to a virtualized guest VM/container
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

    // 2. Database Check Constraint: Enforces that the storage pool is tied to EXACTLY ONE compute resource target
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

    // Fast scans for isolating storage groupings by their pool type lookup
    await queryInterface.addIndex('storage_pools', ['pool_type_id'], {
      name: 'storage_pools_pool_type_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove structural dependencies (Postgres handles internal sequence cleanup automatically)
    await queryInterface.dropTable('storage_pools');
  },
};
