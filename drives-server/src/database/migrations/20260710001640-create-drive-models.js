'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure with UUIDv7 Primary and Foreign Keys + Auto-Incrementing Display Key
    await queryInterface.createTable('drive_models', {
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
      name: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      model_number: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      manufacturer_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match vendors.id
        allowNull: false,
        references: { model: 'vendors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Blocks deleting a manufacturer vendor if a device model is using it
      },
      storage_type_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match storage_types.id
        allowNull: false,
        references: { model: 'storage_types', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      form_factor_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match form_factors.id
        allowNull: false,
        references: { model: 'form_factors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      interface_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match interfaces.id
        allowNull: false,
        references: { model: 'interfaces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      capacity_id: {
        type: Sequelize.UUID, // Upgraded to UUID to match capacities.id
        allowNull: false,
        references: { model: 'capacities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      max_endurance_tbw: {
        type: Sequelize.INTEGER,
        allowNull: true, // Nullable for Magnetic spinning media, required for SSD/Optane
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

    // 2. Unique Composite Index: Prevents entry of duplicate catalog variations
    await queryInterface.addIndex(
      'drive_models',
      ['manufacturer_id', 'name', 'model_number'],
      {
        name: 'drive_models_unique_spec_idx',
        unique: true,
      },
    );

    // 3. Foreign Key Lookup Performance Optimization Indexes
    await queryInterface.addIndex('drive_models', ['storage_type_id'], {
      name: 'drive_models_type_idx',
      using: 'btree',
    });
    await queryInterface.addIndex('drive_models', ['form_factor_id'], {
      name: 'drive_models_form_factor_idx',
      using: 'btree',
    });
    await queryInterface.addIndex('drive_models', ['interface_id'], {
      name: 'drive_models_interface_idx',
      using: 'btree',
    });
    await queryInterface.addIndex('drive_models', ['capacity_id'], {
      name: 'drive_models_capacity_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table safely (Postgres handles internal sequence cleanup automatically)
    await queryInterface.dropTable('drive_models');
  },
};
