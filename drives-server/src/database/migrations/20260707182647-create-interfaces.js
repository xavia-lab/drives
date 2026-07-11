'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Sequence for Interfaces
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "interfaces_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`
    );

    // 2. Create Interfaces Table with explicit Foreign Key relationship
    await queryInterface.createTable('interfaces', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"interfaces_id_seq"\')'),
      },
      name: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      bus_protocol_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'bus_protocols', // Target parent table
          key: 'id'               // Target primary key
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'    // Protect core database integrity constraints
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

    // 3. Add Index for high-velocity lookups and table JOIN optimization
    await queryInterface.addIndex('interfaces', ['name'], {
      name: 'interfaces_name',
      using: 'btree',
    });
    await queryInterface.addIndex('interfaces', ['bus_protocol_id'], {
      name: 'interfaces_bus_protocol_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table first to cleanly release constraint bindings
    await queryInterface.dropTable('interfaces');
    
    // Clean up sequence
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "interfaces_id_seq";`
    );
  },
};
