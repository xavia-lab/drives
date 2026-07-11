'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('logical_vdevs', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      storage_pool_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match storage_pools.id
        allowNull: false,
        references: {
          model: 'storage_pools',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Blocks deleting a pool if it contains active underlying redundancy structures
      },
      vdev_name: {
        type: Sequelize.STRING(32),
        allowNull: false, // e.g., 'raidz2-0', 'mirror-1'
      },
      vdev_redundancy_profile: {
        type: Sequelize.ENUM(
          'STRIPE',
          'MIRROR',
          'RAIDZ1',
          'RAIDZ2',
          'RAIDZ3',
          'JBOD_SINGLE',
        ),
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

    // 2. Performance Optimization Indexes
    await queryInterface.addIndex('logical_vdevs', ['storage_pool_id'], {
      name: 'logical_vdevs_storage_pool_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove structural dependencies (sequences are no longer used)
    await queryInterface.dropTable('logical_vdevs');

    // Clean up localized PostgreSQL types created exclusively for this table state
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_logical_vdevs_vdev_redundancy_profile";`,
    );
  },
};
