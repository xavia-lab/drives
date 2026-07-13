'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('racks', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      name: {
        type: Sequelize.STRING(32),
        allowNull: false, // e.g., 'RACK-B12'
      },
      datacenter_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'datacenters', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Prevent deleting a datacenter if it contains cabinets
      },
      total_rack_units: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 42, // Standard data center rack cabinet height sizing layout
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

    // 🌟 Performance Indexing
    await queryInterface.addIndex('racks', ['datacenter_id'], {
      name: 'racks_datacenter_id_idx',
      using: 'btree',
    });

    // 🌟 Layout Integrity: Enforce unique rack naming identifiers inside the same building facility location
    await queryInterface.addIndex('racks', ['datacenter_id', 'name'], {
      name: 'racks_datacenter_name_unique_idx',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('racks');
  },
};
