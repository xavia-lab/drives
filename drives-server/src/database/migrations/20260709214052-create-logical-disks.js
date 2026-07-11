'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Logical Disks Mapping
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "logical_disks_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Table Structure with Unified Integer References
    await queryInterface.createTable('logical_disks', {
      id: {
        type: Sequelize.INTEGER, // FIX: Converted from UUID to common INTEGER primary key index
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"logical_disks_id_seq"\')'), // Numerical generator sequencing
      },
      logical_vdev_id: {
        type: Sequelize.INTEGER, // FIX: Converted to INTEGER to match updated logical_vdevs layout
        allowNull: false,
        references: { model: 'logical_vdevs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Blocks removing a vdev configuration block if active drive links exist
      },
      physical_drive_id: {
        type: Sequelize.INTEGER, // FIX: Converted to INTEGER to match updated physical_drives layout
        allowNull: false,
        references: { model: 'physical_drives', key: 'id' }, // Points back to actual physical asset block
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      os_device_node_path: {
        type: Sequelize.STRING(32),
        allowNull: false, // e.g., '/dev/nvme0n1', '/dev/sda'
      },
      is_spare_drive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false, // True if flagged as a hot-spare for automated pool rebuilding
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

    // --- Performance & Data Integrity Indexes ---

    // Unique Constraint: Prevents a physical drive from being assigned to multiple pools/vdevs simultaneously
    await queryInterface.addIndex('logical_disks', ['physical_drive_id'], {
      name: 'logical_disks_phys_drive_unique_idx',
      unique: true,
    });

    // B-Tree Optimization: Speeds up finding all drive members assigned to a specific virtual device group
    await queryInterface.addIndex('logical_disks', ['logical_vdev_id'], {
      name: 'logical_disks_logical_vdev_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove dependencies
    await queryInterface.dropTable('logical_disks');

    // Purge the sequential ID generator sequence
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "logical_disks_id_seq";`,
    );
  },
};
