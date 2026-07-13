'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys
    await queryInterface.createTable('virtual_servers', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      host_server_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'servers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Prevents deleting a physical server if it still hosts active VMs
      },
      vmid: {
        type: Sequelize.INTEGER,
        allowNull: true, // Nullable to accommodate non-Proxmox baremetal hypervisors if needed
        comment:
          'The native Hypervisor cluster VMID cluster identifier (e.g., 100, 101)',
      },
      hostname: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true, // e.g., 'truenas-core.local' or 'omv-nas-01.infra'
      },
      type: {
        type: Sequelize.ENUM('VM', 'CONTAINER'),
        defaultValue: 'VM',
        allowNull: false,
      },
      operating_system_id: {
        type: Sequelize.UUID, // 🌟 Normalized structural lookup pointer
        allowNull: false,
        references: { model: 'operating_systems', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      allocated_vcpus: {
        type: Sequelize.INTEGER,
        allowNull: false, // e.g., 4, 8
      },
      allocated_ram_mb: {
        type: Sequelize.INTEGER,
        allowNull: false, // e.g., 8192, 16384 (Stored in MB for precise integer computation)
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // --- Performance Optimization Indexes ---

    // Optimizes hypervisor density mapping and host performance tracking lookup trees
    await queryInterface.addIndex('virtual_servers', ['host_server_id'], {
      name: 'virtual_servers_host_server_idx',
      using: 'btree',
    });

    // Enforces unique VMID tracking constraints inside a single physical hypervisor host group
    await queryInterface.addIndex(
      'virtual_servers',
      ['host_server_id', 'vmid'],
      {
        name: 'virtual_servers_vmid_unique_idx',
        unique: true,
        where: {
          vmid: { [Sequelize.Op.ne]: null },
        },
      },
    );

    // 🌟 Fast metric lookup index for calculating total virtual OS instances
    await queryInterface.addIndex('virtual_servers', ['operating_system_id'], {
      name: 'virtual_servers_operating_system_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove structural dependencies
    await queryInterface.dropTable('virtual_servers');

    // Drop the specialized enum schema mapping type safely
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_virtual_servers_type";`,
    );
  },
};
