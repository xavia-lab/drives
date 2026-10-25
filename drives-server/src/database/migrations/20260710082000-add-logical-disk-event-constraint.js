'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "logical_disk_events"
        ADD CONSTRAINT "logical_disk_events_action_semantics_check"
        CHECK (
          (action = 'ATTACH' AND from_vdev_id IS NULL) OR
          (action = 'DETACH' AND to_vdev_id IS NULL) OR
          (action = 'MOVE' AND (
            from_vdev_id IS NULL OR
            to_vdev_id IS NULL OR
            from_vdev_id <> to_vdev_id
          )) OR
          (action = 'UPDATE' AND (
            from_vdev_id IS NULL OR
            to_vdev_id IS NULL OR
            from_vdev_id = to_vdev_id
          ))
        );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "logical_disk_events"
        DROP CONSTRAINT IF EXISTS "logical_disk_events_action_semantics_check";
    `);
  },
};
