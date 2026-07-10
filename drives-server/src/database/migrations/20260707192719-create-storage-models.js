'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Auto-increment Sequence for Storage Models
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "storage_models_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`
    );

    // 2. Create Table Structure with Referential Integrity Controls
    await queryInterface.createTable('storage_models', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"storage_models_id_seq"\')'),
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
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vendors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Blocks deleting a manufacturer vendor if a device model is using it
      },
      storage_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'storage_types', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      form_factor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'form_factors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      interface_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'interfaces', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      capacity_id: {
        type: Sequelize.INTEGER,
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

    // 3. Unique Composite Index: Prevents entry of duplicate catalog variations
    await queryInterface.addIndex(
      'storage_models',
      ['manufacturer_id', 'name', 'model_number'],
      {
        name: 'storage_models_unique_spec_idx',
        unique: true,
      }
    );

    // 4. Foreign Key Lookup Performance Optimization Indexes
    await queryInterface.addIndex('storage_models', ['storage_type_id'], { name: 'storage_models_type_idx', using: 'btree' });
    await queryInterface.addIndex('storage_models', ['form_factor_id'], { name: 'storage_models_form_factor_idx', using: 'btree' });
    await queryInterface.addIndex('storage_models', ['interface_id'], { name: 'storage_models_interface_idx', using: 'btree' });
    await queryInterface.addIndex('storage_models', ['capacity_id'], { name: 'storage_models_capacity_idx', using: 'btree' });
  },

  async down(queryInterface, Sequelize) {
    // Drop table first to release constraints smoothly
    await queryInterface.dropTable('storage_models');
    
    // Purge related sequence matching table definition
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "storage_models_id_seq";`
    );
  },
};
