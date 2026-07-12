'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Datacenters Table with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('datacenters', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      code: {
        type: Sequelize.STRING(16),
        allowNull: false,
        unique: true, // Unique facility naming key (e.g., 'VA-ASH-1', 'LON-SLO-2')
      },
      name: {
        type: Sequelize.STRING(128),
        allowNull: false, // User friendly description (e.g., 'Ashburn Corporate Center 1')
      },
      country_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match countries.id
        allowNull: false,
        references: {
          model: 'countries',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      city: {
        type: Sequelize.STRING(64),
        allowNull: false, // e.g., 'Ashburn', 'Slough'
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

    // 2. Add Index for spatial/geopolitical reporting aggregations
    await queryInterface.addIndex('datacenters', ['country_id'], {
      name: 'datacenters_country_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove references (sequences are no longer used)
    await queryInterface.dropTable('datacenters');
  },
};
