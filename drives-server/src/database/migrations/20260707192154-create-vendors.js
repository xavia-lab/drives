'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "vendors_id_seq" INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;`
    );

    await queryInterface.createTable('vendors', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('nextval(\'"vendors_id_seq"\')'),
      },
      name: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      country_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'countries', key: 'id' },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
      },
      is_manufacturer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      is_retailer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      support_contact_email: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      portal_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
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

    await queryInterface.addIndex('vendors', ['name'], {
      name: 'vendors_name_idx',
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vendors');
    await queryInterface.sequelize.query(`DROP SEQUENCE IF EXISTS "vendors_id_seq";`);
  },
};
