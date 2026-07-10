'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Logical Vdevs
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "logical_vdevs_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Table Structure with Unified Integer References
    await queryInterface.createTable('logical_vdevs', {
      id: {
        type: Sequelize.INTEGER, // FIX: Converted from UUID to common INTEGER primary key index
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"logical_vdevs_id_seq"\')'), // Numerical generator sequencing
      },
      storage_pool_id: {
        type: Sequelize.INTEGER, // FIX: Converted to INTEGER to match the updated storage_pools layout
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

    // 3. Performance Optimization Indexes
    await queryInterface.addIndex('logical_vdevs', ['storage_pool_id'], {
      name: 'logical_vdevs_storage_pool_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove structural dependencies
    await queryInterface.dropTable('logical_vdevs');

    // Purge the sequential ID generator sequence
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "logical_vdevs_id_seq";`,
    );

    // Clean up localized PostgreSQL types created exclusively for this table state
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_logical_vdevs_vdev_redundancy_profile";`,
    );
  },
};
