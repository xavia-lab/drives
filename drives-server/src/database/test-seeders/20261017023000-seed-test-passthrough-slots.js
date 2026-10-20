'use strict';

// TEST-ONLY fixture for the `passthrough_slots` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.
//
// Maps host physical-server backplane slots (20261017015640-seed-test-server-slots.js)
// into guests (20261017021320-seed-test-virtual-servers.js). Each host
// slot is passed through at most once, and only to a guest running on the same
// host, matching the service-level invariants.

const { idMap, required } = require('./lib/lookups');

// `server_hostname` is the host that owns the slot; it must match the guest's host.
const passthroughSlots = [
  {
    id: '019f6a40-0000-7e11-8e11-000000000001',
    virtual_server_hostname: 'vm-web-01',
    server_hostname: 'ash-compute-01',
    slot_label: 'Bay 0',
  },
  {
    id: '019f6a40-0000-7e11-8e11-000000000002',
    virtual_server_hostname: 'vm-db-01',
    server_hostname: 'ash-compute-01',
    slot_label: 'Bay 1',
  },
  {
    id: '019f6a40-0000-7e11-8e11-000000000003',
    virtual_server_hostname: 'vm-db-01',
    server_hostname: 'ash-compute-01',
    slot_label: 'Bay 2',
  },
  {
    id: '019f6a40-0000-7e11-8e11-000000000004',
    virtual_server_hostname: 'vm-app-01',
    server_hostname: 'ash-compute-02',
    slot_label: 'Bay 0',
  },
  {
    id: '019f6a40-0000-7e11-8e11-000000000005',
    virtual_server_hostname: 'vm-app-01',
    server_hostname: 'ash-compute-02',
    slot_label: 'Bay 1',
  },
  {
    id: '019f6a40-0000-7e11-8e11-000000000006',
    virtual_server_hostname: 'vm-k8s-01',
    server_hostname: 'slo-compute-01',
    slot_label: 'Bay 0',
  },
  {
    id: '019f6a40-0000-7e11-8e11-000000000007',
    virtual_server_hostname: 'vm-truenas-vm-01',
    server_hostname: 'slo-nas-01',
    slot_label: 'SLOG 0',
  },
  {
    id: '019f6a40-0000-7e11-8e11-000000000008',
    virtual_server_hostname: 'vm-truenas-vm-01',
    server_hostname: 'slo-nas-01',
    slot_label: 'SLOG 1',
  },
  {
    id: '019f6a40-0000-7e11-8e11-000000000009',
    virtual_server_hostname: 'vm-truenas-vm-01',
    server_hostname: 'slo-nas-01',
    slot_label: 'L2ARC 0',
  },
  {
    id: '019f6a40-0000-7e11-8e11-00000000000a',
    virtual_server_hostname: 'vm-truenas-vm-01',
    server_hostname: 'slo-nas-01',
    slot_label: 'L2ARC 1',
  },
  {
    id: '019f6a40-0000-7e11-8e11-00000000000b',
    virtual_server_hostname: 'vm-build-01',
    server_hostname: 'fra-compute-01',
    slot_label: 'Bay 0',
  },
  {
    id: '019f6a40-0000-7e11-8e11-00000000000c',
    virtual_server_hostname: 'vm-backup-01',
    server_hostname: 'fra-storage-01',
    slot_label: 'HDD Bay 10',
  },
  {
    id: '019f6a40-0000-7e11-8e11-00000000000d',
    virtual_server_hostname: 'vm-backup-01',
    server_hostname: 'fra-storage-01',
    slot_label: 'HDD Bay 11',
  },
];

module.exports = {
  async up(queryInterface) {
    const virtualServers = await idMap(
      queryInterface,
      'virtual_servers',
      'hostname',
    );

    // Resolve slots by their (host, label) business key rather than hardcoding
    // the deterministic IDs minted by the server-slots seeder.
    const [slotRows] = await queryInterface.sequelize.query(
      `SELECT ss.id AS id, ps.hostname AS hostname, ss.slot_label AS slot_label
         FROM server_slots ss
         JOIN physical_servers ps ON ps.id = ss.server_id;`,
    );
    const slots = slotRows.reduce((acc, row) => {
      acc[`${row.hostname}/${row.slot_label}`] = row.id;
      return acc;
    }, {});

    await queryInterface.bulkInsert(
      'passthrough_slots',
      passthroughSlots.map(
        ({ virtual_server_hostname, server_hostname, slot_label, ...row }) => ({
          ...row,
          virtual_server_id: required(
            virtualServers,
            virtual_server_hostname,
            'virtual_servers',
          ),
          server_slot_id: required(
            slots,
            `${server_hostname}/${slot_label}`,
            'server_slots',
          ),
          created_at: new Date(),
          updated_at: new Date(),
        }),
      ),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'passthrough_slots',
      { id: { [Op.in]: passthroughSlots.map((item) => item.id) } },
      {},
    );
  },
};
