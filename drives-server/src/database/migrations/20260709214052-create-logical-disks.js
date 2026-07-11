'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('logical_disks', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      logical_vdev_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match logical_vdevs.id
        allowNull: false,
        references: { model: 'logical_vdevs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Blocks removing a vdev configuration block if active drive links exist
      },
      physical_drive_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match physical_drives.id
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
    // Drop target table cleanly to remove dependencies (sequences are no longer used)
    await queryInterface.dropTable('logical_disks');
  },
};
