'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Virtual Servers
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "virtual_servers_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Table Structure
    await queryInterface.createTable('virtual_servers', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal(
          'nextval(\'"virtual_servers_id_seq"\')',
        ),
      },
      host_server_id: {
        type: Sequelize.INTEGER,
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
      os_type: {
        type: Sequelize.STRING(32),
        allowNull: false, // e.g., 'debian', 'freebsd', 'alpine'
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('virtual_servers');

    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "virtual_servers_id_seq";`,
    );

    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_virtual_servers_type";`,
    );
  },
};
