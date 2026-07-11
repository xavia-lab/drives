'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Datacenters
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "datacenters_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Datacenters Table
    await queryInterface.createTable('datacenters', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"datacenters_id_seq"\')'),
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
        type: Sequelize.INTEGER, // FIX: Converted from STRING(2) code to unified INTEGER pointer
        allowNull: false,
        references: {
          model: 'countries',
          key: 'id', // Updated to match your common integer primary key strategy
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      city: {
        type: Sequelize.STRING(64),
        allowNull: false, // e.g., 'Ashburn', 'Slough'
      },
      managed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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

    // 3. Add Index for spatial/geopolitical reporting aggregations
    await queryInterface.addIndex('datacenters', ['country_id'], {
      name: 'datacenters_country_id_idx', // Fixed index name to accurately track your column update
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('datacenters');
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "datacenters_id_seq";`,
    );
  },
};
