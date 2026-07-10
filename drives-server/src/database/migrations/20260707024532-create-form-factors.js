'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Sequence
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "form_factors_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`,
    );

    // 2. Create the Table
    await queryInterface.createTable('form_factors', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"form_factors_id_seq"\')'),
      },
      name: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      slot_pitch_mm: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: true, // Nullable to protect edge case form factors without rigid pitches
      },
      managed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addIndex('form_factors', ['name'], {
      name: 'form_factors_name',
      unique: true,
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table first, then the sequence
    await queryInterface.dropTable('form_factors');
    await queryInterface.sequelize.query(
      `DROP SEQUENCE IF EXISTS "form_factors_id_seq";`,
    );
  },
};
