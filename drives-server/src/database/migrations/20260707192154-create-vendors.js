'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Table with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('vendors', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      name: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      country_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match countries.id
        allowNull: false,
        references: { model: 'countries', key: 'id' },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
      },
      is_manufacturer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      is_retailer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      support_contact_email: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      portal_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      managed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // 2. Create Lookup Index
    await queryInterface.addIndex('vendors', ['name'], {
      name: 'vendors_name_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table safely (sequences are no longer used)
    await queryInterface.dropTable('vendors');
  },
};
