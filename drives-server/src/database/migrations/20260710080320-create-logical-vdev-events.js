'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('logical_vdev_events', {
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
        allowNull: true,
        references: { model: 'logical_vdevs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      storage_pool_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'storage_pools', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE'),
        allowNull: false,
      },
      before_snapshot: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      after_snapshot: {
        type: Sequelize.JSONB,
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
      notes: {
        type: Sequelize.TEXT,
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
      'logical_vdev_events',
      ['logical_vdev_id', 'event_timestamp', 'display_key'],
      { name: 'logical_vdev_events_history_idx', using: 'btree' },
    );
    await queryInterface.addIndex(
      'logical_vdev_events',
      ['storage_pool_id', 'event_timestamp'],
      { name: 'logical_vdev_events_pool_idx', using: 'btree' },
    );
    await queryInterface.addIndex(
      'logical_vdev_events',
      ['performed_by_user_id'],
      { name: 'logical_vdev_events_performed_by_idx', using: 'btree' },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('logical_vdev_events');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_logical_vdev_events_action";`,
    );
  },
};
