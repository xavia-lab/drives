'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        comment: 'Keycloak subject ID (sub)',
      },
      email: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      first_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      first_name: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      roles: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      realm: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      client_id: {
        type: Sequelize.STRING(64),
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  },
};
