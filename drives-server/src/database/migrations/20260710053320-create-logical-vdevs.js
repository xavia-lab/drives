'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('logical_vdevs', {
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
      storage_pool_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'storage_pools',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      redundancy_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'vdev_profiles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      vdev_name: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      vdev_class: {
        type: Sequelize.ENUM('DATA', 'LOG', 'CACHE', 'SPECIAL', 'SPARE'),
        allowNull: false,
        defaultValue: 'DATA',
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      profile_snapshot: {
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

    await queryInterface.addIndex('logical_vdevs', ['storage_pool_id'], {
      name: 'logical_vdevs_storage_pool_id_idx',
      using: 'btree',
    });
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "logical_vdevs_pool_name_ci_unique_idx"
        ON "logical_vdevs" ("storage_pool_id", lower("vdev_name"));
    `);
    await queryInterface.addIndex('logical_vdevs', ['redundancy_profile_id'], {
      name: 'logical_vdevs_redundancy_profile_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('logical_vdevs');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_logical_vdevs_vdev_class";`,
    );
  },
};
