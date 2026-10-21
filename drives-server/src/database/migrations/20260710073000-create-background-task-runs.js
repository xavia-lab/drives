'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await queryInterface.tableExists('background_task_runs'))) {
      await queryInterface.createTable('background_task_runs', {
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
        task_key: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        trigger_type: {
          type: Sequelize.ENUM('SCHEDULED', 'MANUAL'),
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED'),
          allowNull: false,
          defaultValue: 'RUNNING',
        },
        started_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        finished_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        duration_ms: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        result: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        error_message: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        triggered_by_user_id: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        instance_id: {
          type: Sequelize.STRING(128),
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
    }

    const indexes = await queryInterface.showIndex('background_task_runs');
    const names = new Set(indexes.map((index) => index.name));

    if (!names.has('background_task_runs_task_started_idx')) {
      await queryInterface.addIndex(
        'background_task_runs',
        ['task_key', 'started_at'],
        {
          name: 'background_task_runs_task_started_idx',
          using: 'btree',
        },
      );
    }
    if (!names.has('background_task_runs_status_idx')) {
      await queryInterface.addIndex('background_task_runs', ['status'], {
        name: 'background_task_runs_status_idx',
        using: 'btree',
      });
    }
    if (!names.has('background_task_runs_user_idx')) {
      await queryInterface.addIndex(
        'background_task_runs',
        ['triggered_by_user_id'],
        {
          name: 'background_task_runs_user_idx',
          using: 'btree',
        },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('background_task_runs');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_background_task_runs_trigger_type";`,
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_background_task_runs_status";`,
    );
  },
};
