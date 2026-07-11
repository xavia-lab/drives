'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Servers
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "servers_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Servers Table with Bare-Metal Hardware Specs
    await queryInterface.createTable('servers', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"servers_id_seq"\')'),
      },
      hostname: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true, // e.g., 'us-east-compute-42.infra'
      },
      host_os: {
        type: Sequelize.STRING(64),
        allowNull: false, // e.g., 'Proxmox VE', 'TrueNAS SCALE', 'Ubuntu Server'
      },
      total_ram_mb: {
        type: Sequelize.INTEGER,
        allowNull: false, // Stored in MB to execute dynamic resource capacity calculations
      },
      cpu_model_id: {
        type: Sequelize.INTEGER,
        allowNull: false, // Relational pointer enforcing structural CPU lookup mapping
        references: {
          model: 'cpu_models',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cpu_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1, // Enforces multi-socket processor board accounting (e.g., dual-socket servers)
      },
      datacenter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'datacenters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Blocks facility profiles deletion if nodes reside inside it
      },
      rack_id: {
        type: Sequelize.STRING(32),
        allowNull: false, // e.g., 'RACK-B12'
      },
      rack_unit_position: {
        type: Sequelize.INTEGER,
        allowNull: false, // Position index inside the physical cabinet enclosure (e.g., 22)
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

    // Fast lookup for finding servers grouped inside a single datacenter location
    await queryInterface.addIndex('servers', ['datacenter_id'], {
      name: 'servers_datacenter_id_idx',
      using: 'btree',
    });

    // Fast layout grouping index for asset planning layouts inside physical locations
    await queryInterface.addIndex(
      'servers',
      ['datacenter_id', 'rack_id', 'rack_unit_position'],
      {
        name: 'servers_physical_placement_idx',
        using: 'btree',
      },
    );

    // B-Tree indexing optimization for grouping node capacities by raw processing chips
    await queryInterface.addIndex('servers', ['cpu_model_id'], {
      name: 'servers_cpu_model_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to release constraints
    await queryInterface.dropTable('servers');

    // Purge the sequential ID generator
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "servers_id_seq";`,
    );
  },
};
