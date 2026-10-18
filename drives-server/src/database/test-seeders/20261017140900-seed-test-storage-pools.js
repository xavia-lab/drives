'use strict';

// TEST-ONLY fixture for the `storage_pools` table. Not part of production seeding.
// Run via `pnpm --filter @drives/drives-server seed:test`.
//
// Each pool is tied to EXACTLY ONE target (a physical host OR a virtual guest),
// mirroring the `storage_pools_target_exclusivity_check` constraint and the
// service-level XOR rule. Pool types come from the production `pool_types`
// lookup (20260709213010-seed-pool-types.js), which must be seeded first.

const { idMap, required } = require('./lib/lookups');

const storagePools = [
  {
    id: '019f6a50-0000-7e50-8e50-000000000001',
    pool_name: 'tank-nvme-cache',
    pool_type_name: 'ZFS',
    encryption_enabled: true,
    server_hostname: 'ash-storage-01',
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000002',
    pool_name: 'btrfs-data-array',
    pool_type_name: 'BTRFS',
    encryption_enabled: false,
    server_hostname: 'ash-storage-01',
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000003',
    pool_name: 'mdraid-scratch',
    pool_type_name: 'MDRAID',
    encryption_enabled: false,
    server_hostname: 'ash-compute-01',
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000004',
    pool_name: 'raw-jbod-archive',
    pool_type_name: 'RAW_JBOD',
    encryption_enabled: true,
    server_hostname: 'slo-nas-01',
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000005',
    pool_name: 'ceph-osd-k8s',
    pool_type_name: 'CEPH_OSD_POOL',
    encryption_enabled: true,
    virtual_server_hostname: 'vm-k8s-01',
  },
  {
    id: '019f6a50-0000-7e50-8e50-000000000006',
    pool_name: 'truenas-vm-pool',
    pool_type_name: 'ZFS',
    encryption_enabled: false,
    virtual_server_hostname: 'vm-truenas-vm-01',
  },
];

module.exports = {
  async up(queryInterface) {
    const poolTypes = await idMap(queryInterface, 'pool_types', 'name');
    const servers = await idMap(queryInterface, 'physical_servers', 'hostname');
    const virtualServers = await idMap(
      queryInterface,
      'virtual_servers',
      'hostname',
    );

    await queryInterface.bulkInsert(
      'storage_pools',
      storagePools.map(
        ({ pool_type_name, server_hostname, virtual_server_hostname, ...row }) => ({
          ...row,
          pool_type_id: required(poolTypes, pool_type_name, 'pool_types'),
          server_id: server_hostname
            ? required(servers, server_hostname, 'physical_servers')
            : null,
          virtual_server_id: virtual_server_hostname
            ? required(
                virtualServers,
                virtual_server_hostname,
                'virtual_servers',
              )
            : null,
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
      'storage_pools',
      { id: { [Op.in]: storagePools.map((item) => item.id) } },
      {},
    );
  },
};
