'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('physical_servers', {
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
        unique: true, // Automatically builds a high-performance index for sorting/filtering
      },
      hostname: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true, // e.g., 'us-east-compute-42.infra'
      },
      memory_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      memory_unit: {
        // RAM is addressed in powers of two, so binary units are used
        type: Sequelize.ENUM('MiB', 'GiB', 'TiB'),
        allowNull: false,
        defaultValue: 'GiB',
      },
      absolute_memory: {
        // Denormalised byte count (value converted by unit) for server-side
        // sorting and range filtering. Whole bytes -> BIGINT (exact).
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      operating_system_id: {
        type: Sequelize.UUID, // 🌟 Normalized structural lookup pointer
        allowNull: false,
        references: { model: 'operating_systems', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      rack_id: {
        type: Sequelize.UUID,
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
    await queryInterface.addIndex('physical_servers', ['rack_id'], {
      name: 'physical_servers_rack_id_idx',
      using: 'btree',
    });

    // Enforce unique structural grid footprints: Blocks two physical chassis devices from claiming the same Rack Elevation slot
    await queryInterface.addIndex(
      'physical_servers',
      ['rack_id', 'rack_unit_position'],
      {
        name: 'physical_servers_placement_unique_idx',
        unique: true,
      },
    );

    // Fast metric lookup index for calculating total OS system allocations app-wide
    await queryInterface.addIndex('physical_servers', ['operating_system_id'], {
      name: 'physical_servers_operating_system_id_idx',
      using: 'btree',
    });

    // Index the stored byte count to keep ORDER BY absolute_memory fast
    await queryInterface.addIndex('physical_servers', ['absolute_memory'], {
      name: 'physical_servers_absolute_memory_idx',
      using: 'btree',
    });
  },

  async down(queryInterface) {
    // Drop table safely (Postgres handles internal sequence cleanup automatically)
    await queryInterface.dropTable('physical_servers');

    // Clean up Postgres ENUM type created by Sequelize
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_physical_servers_memory_unit";',
    );
  },
};
