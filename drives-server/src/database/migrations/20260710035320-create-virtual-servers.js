'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys + Auto-Incrementing Display Key
    await queryInterface.createTable('virtual_servers', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      display_key: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        unique: true, // Automatically builds a high-performance index for sorting/filtering
      },
      host_server_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'physical_servers', key: 'id' },
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
      allocated_memory_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0, // e.g., 8, 16 expressed in the selected allocated_memory_unit
      },
      allocated_memory_unit: {
        // RAM is addressed in powers of two, so binary units are used
        type: Sequelize.ENUM('MiB', 'GiB', 'TiB'),
        allowNull: false,
        defaultValue: 'GiB',
      },
      absolute_allocated_memory: {
        // Denormalised byte count (value converted by unit) for server-side
        // sorting and range filtering. Whole bytes -> BIGINT (exact).
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
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

    // Index the stored byte count to keep ORDER BY absolute_allocated_memory fast
    await queryInterface.addIndex(
      'virtual_servers',
      ['absolute_allocated_memory'],
      {
        name: 'virtual_servers_absolute_allocated_memory_idx',
        using: 'btree',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove structural dependencies (Postgres handles internal sequence cleanup automatically)
    await queryInterface.dropTable('virtual_servers');

    // Drop the specialized enum schema mapping type safely
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_virtual_servers_type";`,
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_virtual_servers_allocated_memory_unit";`,
    );
  },
};
