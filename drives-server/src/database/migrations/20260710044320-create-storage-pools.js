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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // A pool's compute host is no longer a rigid column on this table. Hosting
    // is modelled as a many-to-many-over-time relationship in the
    // `storage_pool_hosts` IMPORT/EXPORT event log (see
    // 20260710050000-create-storage-pool-hosts.js), which lets a pool be
    // exported from one server and imported into another while keeping history.

    // Fast scans for isolating storage groupings by their pool type lookup
    await queryInterface.addIndex('storage_pools', ['pool_type_id'], {
      name: 'storage_pools_pool_type_id_idx',
      using: 'btree',
    });
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "storage_pools_pool_name_ci_unique_idx"
        ON "storage_pools" (lower("pool_name"));
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove structural dependencies (Postgres handles internal sequence cleanup automatically)
    await queryInterface.dropTable('storage_pools');
  },
};
