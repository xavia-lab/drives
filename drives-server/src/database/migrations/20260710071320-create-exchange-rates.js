'use strict';

/**
 * Historical USD exchange rates per currency.
 *
 * A periodic market-data worker can append new observations to this table; the
 * application always consumes the latest `effective_at` row for a currency.
 * Keeping rates out of `currencies` preserves the currency lookup as static
 * reference data and retains rate history.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Dev databases run with `synchronize: true`, which may have already
    // created the table from the entity definition. Keep the migration safe to
    // run in that case as well as on a clean database.
    if (!(await queryInterface.tableExists('exchange_rates'))) {
      await queryInterface.createTable('exchange_rates', {
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
          unique: true,
        },
        currency_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'currencies',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        rate_to_usd: {
          type: Sequelize.DECIMAL(18, 10),
          allowNull: false,
        },
        effective_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        source: {
          type: Sequelize.STRING(64),
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
    }

    const indexes = await queryInterface.showIndex('exchange_rates');
    const indexNames = new Set(indexes.map((index) => index.name));

    if (!indexNames.has('exchange_rates_currency_effective_idx')) {
      await queryInterface.addIndex(
        'exchange_rates',
        ['currency_id', 'effective_at'],
        {
          name: 'exchange_rates_currency_effective_idx',
          using: 'btree',
        },
      );
    }

    if (!indexNames.has('exchange_rates_currency_effective_unique_idx')) {
      await queryInterface.addIndex(
        'exchange_rates',
        ['currency_id', 'effective_at'],
        {
          name: 'exchange_rates_currency_effective_unique_idx',
          unique: true,
          using: 'btree',
        },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('exchange_rates');
  },
};
