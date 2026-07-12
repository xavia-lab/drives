'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('servers', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      hostname: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true, // e.g., 'us-east-compute-42.infra'
      },
      operating_system_id: {
        type: Sequelize.UUID, // 🌟 Normalized structural lookup pointer
        allowNull: false,
        references: { model: 'operating_systems', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      total_ram_mb: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cpu_model_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'cpu_models', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cpu_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      rack_id: {
        type: Sequelize.UUID, // 🌟 Upgraded from String to normalized UUIDv7 relation mapping
        allowNull: false,
        references: { model: 'racks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Blocks cabinet teardowns if operational nodes are registered inside it
      },
      rack_unit_position: {
        type: Sequelize.INTEGER,
        allowNull: false, // Elevation tracking inside the physical cabinet enclosure (e.g., 22)
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

    // Optimization for inventory searches grouped inside a specific physical cabinet enclosure location
    await queryInterface.addIndex('servers', ['rack_id'], {
      name: 'servers_rack_id_idx',
      using: 'btree',
    });

    // Enforce unique structural grid footprints: Blocks two physical chassis devices from claiming the same Rack Elevation slot
    await queryInterface.addIndex(
      'servers',
      ['rack_id', 'rack_unit_position'],
      {
        name: 'servers_physical_placement_unique_idx',
        unique: true,
      },
    );

    // B-Tree indexing optimization for capacity accounting by matching architecture chipsets
    await queryInterface.addIndex('servers', ['cpu_model_id'], {
      name: 'servers_cpu_model_id_idx',
      using: 'btree',
    });

    // Fast metric lookup index for calculating total OS system allocations app-wide
    await queryInterface.addIndex('servers', ['operating_system_id'], {
      name: 'servers_operating_system_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('servers');
  },
};
