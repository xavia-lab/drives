'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Physical Drives
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "physical_drives_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create Physical Drives Table
    await queryInterface.createTable('physical_drives', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal(
          'nextval(\'"physical_drives_id_seq"\')',
        ), // Numerical generator sequencing
      },
      storage_model_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'storage_models',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Blocks model deletions if physical drives exist in production inventory
      },
      retailer_vendor_id: {
        type: Sequelize.INTEGER,
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
        allowNull: false,
        unique: true, // Crucial structural constraint for physical hardware verification
      },
      worldwide_name_wwn: {
        type: Sequelize.STRING(32),
        allowNull: true, // Nullable to safely accommodate legacy/unmapped enterprise controllers
        unique: true,
      },
      acquisition_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false, // Enforces procurement accountability tracking for hardware investments
      },
      currency_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'currencies',
          key: 'id', // Replaced old code layout string constraints with correct relational integer mapping
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    // Fast indexed range sweeps for verifying explicit serial values during physical scan operations
    await queryInterface.addIndex('physical_drives', ['serial_number'], {
      name: 'physical_drives_serial_number_idx',
      using: 'btree',
    });

    // B-Tree indexing map optimizing multi-node lookup aggregations across unified model catalogs
    await queryInterface.addIndex('physical_drives', ['storage_model_id'], {
      name: 'physical_drives_storage_model_idx',
      using: 'btree',
    });

    // Financial reporting filter indexing for depreciation audits per currency bucket standard
    await queryInterface.addIndex(
      'physical_drives',
      ['currency_id', 'acquisition_cost'],
      {
        name: 'physical_drives_financial_idx', // Fixed query pointer tracking target column update path
        using: 'btree',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to remove dependencies
    await queryInterface.dropTable('physical_drives');

    // Purge related sequence matching table definition
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "physical_drives_id_seq";`,
    );
  },
};
