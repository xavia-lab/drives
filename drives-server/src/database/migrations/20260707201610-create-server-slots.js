'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('server_slots', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      server_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match servers.id
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
        type: Sequelize.UUID, // Upgraded to UUID to match interfaces.id
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

    // 2. Unique Composite Index: Prevents duplicate label mappings inside the same server node
    await queryInterface.addIndex('server_slots', ['server_id', 'slot_label'], {
      name: 'server_slots_label_unique_idx',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove structural dependencies (sequences are no longer used)
    await queryInterface.dropTable('server_slots');
  },
};
