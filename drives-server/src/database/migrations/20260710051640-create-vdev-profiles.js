'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vdev_profiles', {
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
      code: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      technology: {
        type: Sequelize.ENUM('ZFS', 'MDRAID', 'BTRFS', 'CEPH', 'GENERIC'),
        allowNull: false,
        defaultValue: 'GENERIC',
      },
      min_members: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      max_members: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      parity_members: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      mirror_copies: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      stripe_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      capacity_mode: {
        type: Sequelize.ENUM('SUM', 'MIN', 'PARITY', 'MIRROR_GROUPS'),
        allowNull: false,
        defaultValue: 'SUM',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      managed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vdev_profiles');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_vdev_profiles_technology";`,
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_vdev_profiles_capacity_mode";`,
    );
  },
};
