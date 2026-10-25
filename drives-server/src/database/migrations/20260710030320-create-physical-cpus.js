'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Physical CPUs Table with UUIDv7 Primary and Foreign Keys + Auto-Incrementing Display Key
    await queryInterface.createTable('physical_cpus', {
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
        unique: true, // Automatically builds a unique index for sorting/filtering
      },
      cpu_model_id: {
        type: Sequelize.UUID, // Matches cpu_models.id
        allowNull: false,
        references: {
          model: 'cpu_models',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Blocks model deletions while physical CPU inventory exists
      },
      retailer_vendor_id: {
        type: Sequelize.UUID, // Matches vendors.id
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Protects supply chain tracing constraints
      },
      label: {
        type: Sequelize.STRING(40),
        allowNull: false,
        unique: true,
      },
      serial_number: {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true, // Some CPUs do not expose a serial number
      },
      acquisition_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false, // Enforces procurement accountability tracking for hardware investments
      },
      currency_id: {
        type: Sequelize.UUID, // Matches currencies.id
        allowNull: false,
        references: {
          model: 'currencies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // Owning server (a chip is installed in at most one server). Nullable so a
      // chip can sit in unassigned inventory; deleting a server releases its
      // chips rather than deleting them (ON DELETE SET NULL).
      physical_server_id: {
        type: Sequelize.UUID, // Matches physical_servers.id
        allowNull: true,
        references: {
          model: 'physical_servers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      purchase_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      warranty_expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
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

    // Fast indexed range sweeps for verifying explicit serial values during physical inventory audits
    await queryInterface.addIndex('physical_cpus', ['serial_number'], {
      name: 'physical_cpus_serial_number_idx',
      using: 'btree',
    });

    // B-Tree indexing map optimizing multi-node lookup aggregations across unified CPU catalogs
    await queryInterface.addIndex('physical_cpus', ['cpu_model_id'], {
      name: 'physical_cpus_cpu_model_idx',
      using: 'btree',
    });

    // Financial reporting filter indexing for depreciation audits per currency bucket standard
    await queryInterface.addIndex(
      'physical_cpus',
      ['currency_id', 'acquisition_cost'],
      {
        name: 'physical_cpus_financial_idx',
        using: 'btree',
      },
    );

    // Fast lookup of the chips installed in a given server (server -> many CPUs).
    await queryInterface.addIndex('physical_cpus', ['physical_server_id'], {
      name: 'physical_cpus_physical_server_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove dependencies (Postgres handles internal sequence cleanup automatically)
    await queryInterface.dropTable('physical_cpus');
  },
};
