'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the qr_links Table with UUIDv7
    await queryInterface.createTable('qr_links', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      short_id: {
        type: Sequelize.STRING(21),
        allowNull: false,
      },
      resource_type: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      resource_id: {
        type: Sequelize.STRING(64),
        allowNull: false, // Poly-morphic target tracker matching stringified IDs
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

    // 2. Add Unique Constraints and Indexes using unified snake_case
    await queryInterface.addIndex('qr_links', ['short_id'], {
      name: 'qr_links_short_id_uidx',
      unique: true,
      using: 'btree',
    });

    await queryInterface.addIndex(
      'qr_links',
      ['resource_type', 'resource_id'],
      {
        name: 'qr_links_resource_type_resource_id_uidx',
        unique: true,
        using: 'btree',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    // Safely drop the table cleanly releasing btree constraint scopes
    await queryInterface.dropTable('qr_links');
  },
};
