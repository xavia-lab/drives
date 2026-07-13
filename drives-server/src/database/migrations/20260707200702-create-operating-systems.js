'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('operating_systems', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      name: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true, // e.g., 'Proxmox VE 8.x', 'Ubuntu Server 24.04 LTS'
      },
      vendor: {
        type: Sequelize.STRING(64),
        allowNull: true, // e.g., 'Canonical', 'Proxmox', 'Red Hat'
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
    await queryInterface.dropTable('operating_systems');
  },
};
