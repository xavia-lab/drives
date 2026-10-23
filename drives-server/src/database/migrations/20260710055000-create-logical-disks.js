'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('logical_disks', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      display_key: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        unique: true,
      },
      logical_vdev_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'logical_vdevs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      physical_drive_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'physical_drives', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      os_device_node_path: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      member_role: {
        type: Sequelize.ENUM('DATA', 'SPARE'),
        allowNull: false,
        defaultValue: 'DATA',
      },
      attached_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      member_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      group_index: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex('logical_disks', ['physical_drive_id'], {
      name: 'logical_disks_phys_drive_unique_idx',
      unique: true,
    });
    await queryInterface.addIndex('logical_disks', ['logical_vdev_id'], {
      name: 'logical_disks_logical_vdev_id_idx',
      using: 'btree',
    });
    await queryInterface.addIndex(
      'logical_disks',
      ['logical_vdev_id', 'group_index', 'member_index'],
      {
        name: 'logical_disks_vdev_order_idx',
        using: 'btree',
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('logical_disks');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_logical_disks_member_role";`,
    );
  },
};
