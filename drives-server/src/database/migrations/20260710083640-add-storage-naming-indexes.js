'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "storage_pools_pool_name_ci_unique_idx"
        ON "storage_pools" (lower("pool_name"));
    `);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "logical_vdevs_pool_name_ci_unique_idx"
        ON "logical_vdevs" ("storage_pool_id", lower("vdev_name"));
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "logical_vdevs_pool_name_ci_unique_idx";`,
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "storage_pools_pool_name_ci_unique_idx";`,
    );
  },
};
