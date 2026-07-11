'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Interfaces Table with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('interfaces', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      name: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      bus_protocol_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match bus_protocols.id
        allowNull: false,
        references: {
          model: 'bus_protocols', // Target parent table
          key: 'id', // Target primary key
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Protect core database integrity constraints
      },
      link_generation: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      throughput_gbps: {
        type: Sequelize.DECIMAL(6, 1),
        allowNull: false,
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

    // 2. Add Index for high-velocity lookups and table JOIN optimization
    await queryInterface.addIndex('interfaces', ['name'], {
      name: 'interfaces_name',
      unique: true,
      using: 'btree',
    });
    await queryInterface.addIndex('interfaces', ['bus_protocol_id'], {
      name: 'interfaces_bus_protocol_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table safely (sequences are no longer used)
    await queryInterface.dropTable('interfaces');
  },
};
