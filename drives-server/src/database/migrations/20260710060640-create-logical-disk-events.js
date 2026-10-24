'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('logical_disk_events', {
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
      physical_drive_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'physical_drives', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      logical_vdev_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'logical_vdevs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      from_vdev_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'logical_vdevs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      to_vdev_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'logical_vdevs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.ENUM('ATTACH', 'DETACH', 'MOVE', 'UPDATE'),
        allowNull: false,
      },
      member_role: {
        type: Sequelize.ENUM('DATA', 'SPARE'),
        allowNull: true,
      },
      os_device_node_path: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      member_index: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      group_index: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      event_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      performed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      correlation_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      context_metadata: {
        type: Sequelize.JSONB,
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

    await queryInterface.addIndex(
      'logical_disk_events',
      ['physical_drive_id', 'event_timestamp', 'display_key'],
      {
        name: 'logical_disk_events_drive_history_idx',
        using: 'btree',
      },
    );
    await queryInterface.addIndex(
      'logical_disk_events',
      ['from_vdev_id', 'event_timestamp'],
      {
        name: 'logical_disk_events_from_vdev_idx',
        using: 'btree',
      },
    );
    await queryInterface.addIndex(
      'logical_disk_events',
      ['to_vdev_id', 'event_timestamp'],
      {
        name: 'logical_disk_events_to_vdev_idx',
        using: 'btree',
      },
    );
    await queryInterface.addIndex('logical_disk_events', ['correlation_id'], {
      name: 'logical_disk_events_correlation_idx',
      using: 'btree',
    });
    await queryInterface.addIndex(
      'logical_disk_events',
      ['performed_by_user_id'],
      {
        name: 'logical_disk_events_performed_by_idx',
        using: 'btree',
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('logical_disk_events');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_logical_disk_events_action";`,
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_logical_disk_events_member_role";`,
    );
  },
};
