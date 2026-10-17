'use strict';

// TEST-ONLY fixture for the `server_slots` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.
//
// Slots are owned children of `physical_servers` (see the test physical-server
// fixture in 20261017140400-seed-test-physical-servers.js) and reference the
// production `interfaces` lookup. Each server gets a plausible backplane layout.

const { idMap, required } = require('./lib/lookups');

const serverSlots = [
  {
    // 2x EPYC compute node: four NVMe data drives plus mirrored SATA boot SSDs.
    server_hostname: 'ash-compute-01',
    slots: [
      { slot_label: 'Bay 0', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:41:00.0' },
      { slot_label: 'Bay 1', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:42:00.0' },
      { slot_label: 'Bay 2', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:43:00.0' },
      { slot_label: 'Bay 3', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:44:00.0' },
      { slot_label: 'Boot 0', interface_name: 'SATA III', pcie_bus_address: null },
      { slot_label: 'Boot 1', interface_name: 'SATA III', pcie_bus_address: null },
    ],
  },
  {
    // 2x EPYC compute node: six NVMe data drives, no separate boot pair.
    server_hostname: 'ash-compute-02',
    slots: [
      { slot_label: 'Bay 0', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:41:00.0' },
      { slot_label: 'Bay 1', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:42:00.0' },
      { slot_label: 'Bay 2', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:43:00.0' },
      { slot_label: 'Bay 3', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:44:00.0' },
      { slot_label: 'Bay 4', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:45:00.0' },
      { slot_label: 'Bay 5', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:46:00.0' },
    ],
  },
  {
    // Storage chassis: eight SAS HDD bays fronted by two NVMe cache drives.
    server_hostname: 'ash-storage-01',
    slots: [
      { slot_label: 'HDD Bay 0', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 1', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 2', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 3', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 4', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 5', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 6', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 7', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'Cache 0', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:81:00.0' },
      { slot_label: 'Cache 1', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:82:00.0' },
    ],
  },
  {
    // Ampere Altra compute node: eight NVMe Gen 5 bays.
    server_hostname: 'slo-compute-01',
    slots: [
      { slot_label: 'Bay 0', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:01:00.0' },
      { slot_label: 'Bay 1', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:02:00.0' },
      { slot_label: 'Bay 2', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:03:00.0' },
      { slot_label: 'Bay 3', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:04:00.0' },
      { slot_label: 'Bay 4', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:05:00.0' },
      { slot_label: 'Bay 5', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:06:00.0' },
      { slot_label: 'Bay 6', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:07:00.0' },
      { slot_label: 'Bay 7', interface_name: 'NVMe Gen 5.0 x4', pcie_bus_address: '0000:08:00.0' },
    ],
  },
  {
    // TrueNAS head: twelve SAS HDD bays plus SLOG and L2ARC NVMe pairs.
    server_hostname: 'slo-nas-01',
    slots: [
      { slot_label: 'HDD Bay 0', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 1', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 2', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 3', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 4', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 5', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 6', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 7', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 8', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 9', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 10', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'HDD Bay 11', interface_name: 'SAS 12G', pcie_bus_address: null },
      { slot_label: 'SLOG 0', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:41:00.0' },
      { slot_label: 'SLOG 1', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:42:00.0' },
      { slot_label: 'L2ARC 0', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:43:00.0' },
      { slot_label: 'L2ARC 1', interface_name: 'NVMe Gen 4.0 x4', pcie_bus_address: '0000:44:00.0' },
    ],
  },
];

// Flatten to a stable, ordered list so `up` and `down` agree on identifiers.
const flattened = serverSlots.flatMap(({ server_hostname, slots }) =>
  slots.map((slot) => ({ server_hostname, ...slot })),
);

// UUIDv7-shaped, deterministic identifier derived from the slot's ordinal so we
// do not hardcode 40+ literals while still letting `down` target exact rows.
const slotId = (index) =>
  `019f6a00-0000-7e00-8e00-${(index + 1).toString(16).padStart(12, '0')}`;

module.exports = {
  async up(queryInterface) {
    const servers = await idMap(queryInterface, 'physical_servers', 'hostname');
    const interfaces = await idMap(queryInterface, 'interfaces', 'name');

    await queryInterface.bulkInsert(
      'server_slots',
      flattened.map((slot, index) => ({
        id: slotId(index),
        server_id: required(servers, slot.server_hostname, 'physical_servers'),
        slot_label: slot.slot_label,
        supported_interface_id: required(
          interfaces,
          slot.interface_name,
          'interfaces',
        ),
        pcie_bus_address: slot.pcie_bus_address,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'server_slots',
      { id: { [Op.in]: flattened.map((_, index) => slotId(index)) } },
      {},
    );
  },
};
