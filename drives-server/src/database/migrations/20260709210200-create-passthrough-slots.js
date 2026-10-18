'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Join table mapping a physical server's backplane slot (server_slots) into
    // a virtual server as a hardware passthrough device. A server slot may be
    // passed through to at most one virtual server (enforced by the unique index
    // on server_slot_id).
    await queryInterface.createTable('passthrough_slots', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      display_key: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        unique: true,
      },
      virtual_server_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'virtual_servers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Mapping is meaningless without the guest it belongs to
      },
      server_slot_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'server_slots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Removing a host slot also detaches it from the guest
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

    // Optimizes loading a virtual server's full passthrough slot set
    await queryInterface.addIndex('passthrough_slots', ['virtual_server_id'], {
      name: 'passthrough_slots_virtual_server_id_idx',
      using: 'btree',
    });

    // Enforces the "a host slot maps to a single guest" invariant globally
    await queryInterface.addIndex('passthrough_slots', ['server_slot_id'], {
      name: 'passthrough_slots_server_slot_id_unique_idx',
      unique: true,
      using: 'btree',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('passthrough_slots');
  },
};
