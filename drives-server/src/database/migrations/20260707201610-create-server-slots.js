'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Server Slots
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "server_slots_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Table Structure with Restructured Integer Keys
    await queryInterface.createTable('server_slots', {
      id: {
        type: Sequelize.INTEGER, // FIX: Converted from UUID to common INTEGER primary key index
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"server_slots_id_seq"\')'), // Numerical generator sequencing
      },
      server_id: {
        type: Sequelize.INTEGER, // FIX: Converted to INTEGER to match the updated servers schema
        allowNull: false,
        references: {
          model: 'servers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Prevents deleting a server if slot configurations exist
      },
      slot_label: {
        type: Sequelize.STRING(32),
        allowNull: false, // Physical label on the case (e.g., 'Bay 0', 'NVMe-Slot-3')
      },
      supported_interface_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'interfaces',
          key: 'id',
        }, // Enforces link capability verification
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      pcie_bus_address: {
        type: Sequelize.STRING(32),
        allowNull: true, // OS hardware topology string (e.g., '0000:41:00.0')
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

    // 3. Unique Composite Index: Prevents duplicate label mappings inside the same server node
    await queryInterface.addIndex('server_slots', ['server_id', 'slot_label'], {
      name: 'server_slots_label_unique_idx',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove structural dependencies
    await queryInterface.dropTable('server_slots');

    // Purge the sequential ID generator sequence
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "server_slots_id_seq";`,
    );
  },
};
