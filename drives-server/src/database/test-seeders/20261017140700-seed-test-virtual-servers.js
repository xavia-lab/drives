'use strict';

// TEST-ONLY fixture for the `virtual_servers` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.
//
// Guests are hosted by the test physical servers (20261017140400-seed-test-
// physical-servers.js) and reference the production `operating_systems` lookup.
// Allocations are kept well under each host's `absolute_memory` ceiling so the
// fixture stays valid under the service's capacity guard.

const { idMap, required } = require('./lib/lookups');

// Binary byte exponents, mirroring `isBinaryUnit` in
// src/lib/utils/human.readable.bytes.converter.ts. RAM uses MiB/GiB/TiB.
const BINARY_BYTE_EXPONENTS = { MiB: 20, GiB: 30, TiB: 40 };
const toBytes = (value, unit) =>
  Math.round(value * Math.pow(2, BINARY_BYTE_EXPONENTS[unit] ?? 0));

const virtualServers = [
  {
    id: '019f6a30-0000-7d22-8d22-000000000001',
    host_server: 'ash-compute-01',
    vmid: 100,
    hostname: 'vm-web-01',
    type: 'VM',
    os_name: 'Ubuntu 24.04 LTS',
    allocated_vcpus: 8,
    allocated_memory_value: 16,
    allocated_memory_unit: 'GiB',
    is_active: true,
    notes: 'Public web frontend fleet leader.',
  },
  {
    id: '019f6a30-0000-7d22-8d22-000000000002',
    host_server: 'ash-compute-01',
    vmid: 101,
    hostname: 'vm-db-01',
    type: 'VM',
    os_name: 'Ubuntu 24.04 LTS',
    allocated_vcpus: 16,
    allocated_memory_value: 128,
    allocated_memory_unit: 'GiB',
    is_active: true,
    notes: 'Primary PostgreSQL cluster node.',
  },
  {
    id: '019f6a30-0000-7d22-8d22-000000000003',
    host_server: 'ash-compute-01',
    vmid: 200,
    hostname: 'ct-cache-01',
    type: 'CONTAINER',
    os_name: 'Alpine Linux',
    allocated_vcpus: 2,
    allocated_memory_value: 4,
    allocated_memory_unit: 'GiB',
    is_active: true,
    notes: 'Shared Redis/Valkey cache container.',
  },
  {
    id: '019f6a30-0000-7d22-8d22-000000000004',
    host_server: 'ash-compute-02',
    vmid: 100,
    hostname: 'vm-app-01',
    type: 'VM',
    os_name: 'Debian 13',
    allocated_vcpus: 8,
    allocated_memory_value: 32,
    allocated_memory_unit: 'GiB',
    is_active: true,
    notes: 'Blue half of the blue/green application pool.',
  },
  {
    id: '019f6a30-0000-7d22-8d22-000000000005',
    host_server: 'ash-compute-02',
    vmid: 101,
    hostname: 'vm-app-02',
    type: 'VM',
    os_name: 'Debian 13',
    allocated_vcpus: 8,
    allocated_memory_value: 32,
    allocated_memory_unit: 'GiB',
    is_active: false,
    notes: 'Green half of the blue/green application pool.',
  },
  {
    id: '019f6a30-0000-7d22-8d22-000000000006',
    host_server: 'slo-compute-01',
    vmid: 100,
    hostname: 'vm-k8s-01',
    type: 'VM',
    os_name: 'Ubuntu 24.04 LTS',
    allocated_vcpus: 4,
    allocated_memory_value: 8,
    allocated_memory_unit: 'GiB',
    is_active: true,
    notes: 'Single-node Kubernetes control plane.',
  },
  {
    id: '019f6a30-0000-7d22-8d22-000000000007',
    host_server: 'slo-nas-01',
    vmid: 100,
    hostname: 'vm-truenas-vm-01',
    type: 'VM',
    os_name: 'TrueNAS SCALE',
    allocated_vcpus: 4,
    allocated_memory_value: 64,
    allocated_memory_unit: 'GiB',
    is_active: true,
    notes: 'Nested storage VM receiving raw disk passthrough.',
  },
];

module.exports = {
  async up(queryInterface) {
    const servers = await idMap(queryInterface, 'physical_servers', 'hostname');
    const operatingSystems = await idMap(
      queryInterface,
      'operating_systems',
      'name',
    );

    await queryInterface.bulkInsert(
      'virtual_servers',
      virtualServers.map(({ host_server, os_name, ...row }) => ({
        ...row,
        host_server_id: required(servers, host_server, 'physical_servers'),
        operating_system_id: required(
          operatingSystems,
          os_name,
          'operating_systems',
        ),
        // Derived by the VirtualServer @BeforeSave hook in the app; bulkInsert
        // bypasses model hooks, so compute it here.
        absolute_allocated_memory: toBytes(
          row.allocated_memory_value,
          row.allocated_memory_unit,
        ),
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'virtual_servers',
      { id: { [Op.in]: virtualServers.map((item) => item.id) } },
      {},
    );
  },
};
