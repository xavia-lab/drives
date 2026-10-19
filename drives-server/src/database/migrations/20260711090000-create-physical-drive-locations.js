'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure: physical drive <-> datacenter association log
    await queryInterface.createTable('physical_drive_locations', {
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
        unique: true, // Automatically builds a unique B-Tree index for sorting/filtering
      },
      physical_drive_id: {
        type: Sequelize.UUID, // Matches physical_drives.id
        allowNull: false,
        references: { model: 'physical_drives', key: 'id' },
        onUpdate: 'CASCADE',
        // History belongs to the drive; deleting the drive drops its timeline
        onDelete: 'CASCADE',
      },
      datacenter_id: {
        type: Sequelize.UUID, // Matches datacenters.id
        allowNull: false,
        references: { model: 'datacenters', key: 'id' },
        onUpdate: 'CASCADE',
        // A datacenter that still hosts drives in its history cannot be removed
        onDelete: 'RESTRICT',
      },
      located_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true, // Operator comments, ticket refs, transport details, ...
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

    // 2. Pure append-only location log: no "is_active" flag and no partial
    //    unique index. A drive's current location is DERIVED from its latest
    //    row (ordered by `located_at DESC, display_key DESC`); moves are
    //    recorded by appending a new row. The "one current location" invariant
    //    is enforced in the application layer inside a transaction that locks
    //    the drive row.

    // --- Performance Optimization Indexes ---

    // Linear timeline scans for a single drive's location history
    await queryInterface.addIndex(
      'physical_drive_locations',
      ['physical_drive_id', 'located_at'],
      {
        name: 'physical_drive_locations_history_idx',
        using: 'btree',
      },
    );

    // Fast scans for the drives currently located in a given datacenter
    await queryInterface.addIndex('physical_drive_locations', ['datacenter_id'], {
      name: 'physical_drive_locations_datacenter_id_idx',
      using: 'btree',
    });
  },

  async down(queryInterface) {
    // Drop target table cleanly (Postgres handles internal sequence cleanup)
    await queryInterface.dropTable('physical_drive_locations');
  },
};
