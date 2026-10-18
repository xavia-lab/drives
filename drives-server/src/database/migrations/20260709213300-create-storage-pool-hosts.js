'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Table Structure: pool <-> host association and IMPORT/EXPORT log
    await queryInterface.createTable('storage_pool_hosts', {
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
      storage_pool_id: {
        type: Sequelize.UUID, // Matches storage_pools.id
        allowNull: false,
        references: { model: 'storage_pools', key: 'id' },
        onUpdate: 'CASCADE',
        // History belongs to the pool; deleting the pool drops its timeline
        onDelete: 'CASCADE',
      },
      // --- Host reference (polymorphic): exactly one of the two is set ---
      physical_server_id: {
        type: Sequelize.UUID, // Matches physical_servers.id
        allowNull: true, // Set when the event concerns a bare-metal host
        references: { model: 'physical_servers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      virtual_server_id: {
        type: Sequelize.UUID, // Matches virtual_servers.id
        allowNull: true, // Set when the event concerns a virtualized guest
        references: { model: 'virtual_servers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      event_type: {
        type: Sequelize.ENUM(
          'IMPORT', // Pool attached/imported into this host
          'EXPORT', // Pool detached/exported out of this host
        ),
        allowNull: false,
      },
      event_timestamp: {
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

    // 2. Database Check Constraint: every event references EXACTLY ONE host kind
    await queryInterface.sequelize.query(`
      ALTER TABLE "storage_pool_hosts"
        ADD CONSTRAINT "storage_pool_hosts_host_exclusivity_check"
          CHECK (
            (physical_server_id IS NOT NULL AND virtual_server_id IS NOT NULL) = FALSE AND
            (physical_server_id IS NOT NULL OR virtual_server_id IS NOT NULL) = TRUE
            );
    `);

    // 3. Pure append-only log: no "is_active" flag or partial unique index.
    //    A pool's current host is DERIVED from its latest event (IMPORT => attached,
    //    EXPORT => detached); the "at most one host" invariant is enforced in the
    //    application layer inside a transaction that locks the pool row.

    // --- Performance Optimization Indexes ---

    // Linear timeline scans for a single pool's IMPORT/EXPORT history
    await queryInterface.addIndex(
      'storage_pool_hosts',
      ['storage_pool_id', 'event_timestamp'],
      {
        name: 'storage_pool_hosts_history_idx',
        using: 'btree',
      },
    );

    // Fast scans for the pools currently attached to a given host
    await queryInterface.addIndex('storage_pool_hosts', ['physical_server_id'], {
      name: 'storage_pool_hosts_physical_server_id_idx',
      using: 'btree',
      where: { physical_server_id: { [Sequelize.Op.ne]: null } },
    });

    await queryInterface.addIndex('storage_pool_hosts', ['virtual_server_id'], {
      name: 'storage_pool_hosts_virtual_server_id_idx',
      using: 'btree',
      where: { virtual_server_id: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop target table cleanly to clear references (Postgres handles internal sequence cleanup automatically)
    await queryInterface.dropTable('storage_pool_hosts');

    // Drop the specialized enum schema mapping type safely
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_storage_pool_hosts_event_type";`,
    );
  },
};
