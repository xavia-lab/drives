'use strict';

const data = [
  // --- SATA ---
  {
    id: '019f52c0-8bc9-7666-bc71-a4ee39de0d85',
    name: 'SATA I',
    protocol_name: 'SATA',
    link_generation: 1,
    throughput_gbps: 1.5,
  },
  {
    id: '019f52c0-8bc9-7980-8039-005faab3798d',
    name: 'SATA II',
    protocol_name: 'SATA',
    link_generation: 2,
    throughput_gbps: 3.0,
  },
  {
    id: '019f52c0-8bc9-7664-98d0-01551fa17007',
    name: 'SATA III',
    protocol_name: 'SATA',
    link_generation: 3,
    throughput_gbps: 6.0,
  },

  // --- SAS ---
  {
    id: '019f52c0-8bc9-788f-8640-7384797feea2',
    name: 'SAS 3G',
    protocol_name: 'SAS',
    link_generation: 1,
    throughput_gbps: 3.0,
  },
  {
    id: '019f52c0-8bc9-7276-bcb1-4b7c155f2570',
    name: 'SAS 6G',
    protocol_name: 'SAS',
    link_generation: 2,
    throughput_gbps: 6.0,
  },
  {
    id: '019f52c0-8bc9-7e3d-bf07-6fa8f5384838',
    name: 'SAS 12G',
    protocol_name: 'SAS',
    link_generation: 3,
    throughput_gbps: 12.0,
  },
  {
    id: '019f52c0-8bc9-7c84-8186-231d2bf3e9c5',
    name: 'SAS 24G',
    protocol_name: 'SAS',
    link_generation: 4,
    throughput_gbps: 24.0,
  },

  // --- NVMe (Enterprise x4 Lane Configurations) ---
  {
    id: '019f52c0-8bc9-7913-aa0b-de0d358f4cf4',
    name: 'NVMe Gen 3.0 x4',
    protocol_name: 'NVMe',
    link_generation: 3,
    throughput_gbps: 31.5,
  },
  {
    id: '019f52c0-8bc9-7562-b69e-7f8a59d71b8d',
    name: 'NVMe Gen 4.0 x4',
    protocol_name: 'NVMe',
    link_generation: 4,
    throughput_gbps: 63.0,
  },
  {
    id: '019f52c0-8bc9-7e8d-b435-c2331aaf2bdb',
    name: 'NVMe Gen 5.0 x4',
    protocol_name: 'NVMe',
    link_generation: 5,
    throughput_gbps: 126.0,
  },
  {
    id: '019f52c0-8bc9-7872-b675-b75e57ea3140',
    name: 'NVMe Gen 6.0 x4',
    protocol_name: 'NVMe',
    link_generation: 6,
    throughput_gbps: 242.0,
  },

  // --- CXL (Enterprise Storage / Memory Expanders) ---
  {
    id: '019f52c0-8bc9-74ac-9b9f-6c2cc9321429',
    name: 'CXL 1.1 / 2.0 (x8)',
    protocol_name: 'CXL',
    link_generation: 1,
    throughput_gbps: 252.0,
  },
  {
    id: '019f52c0-8bc9-7f80-aa1b-aeccb39bc638',
    name: 'CXL 1.1 / 2.0 (x16)',
    protocol_name: 'CXL',
    link_generation: 2,
    throughput_gbps: 504.0,
  },
  {
    id: '019f52c0-8bc9-7e81-b42d-6b592b9b0882',
    name: 'CXL 3.0 (x8)',
    protocol_name: 'CXL',
    link_generation: 3,
    throughput_gbps: 504.0,
  },
  {
    id: '019f52c0-8bc9-73ad-9c07-4aae736a710b',
    name: 'CXL 3.0 (x16)',
    protocol_name: 'CXL',
    link_generation: 4,
    throughput_gbps: 1008.0,
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Fetch live protocol mappings from parent lookup matrix
    const [protocols] = await queryInterface.sequelize.query(
      'SELECT id, name FROM bus_protocols;'
    );

    const protocolMap = protocols.reduce((acc, row) => {
      acc[row.name] = row.id;
      return acc;
    }, {});

    // 2. Safely resolve specific foreign keys 
    const payload = data.map((item) => {
      const protocolId = protocolMap[item.protocol_name];
      if (!protocolId) {
        throw new Error(
          `Foreign Key Missing: Protocol '${item.protocol_name}' must exist in 'bus_protocols' before executing this seed packet.`,
        );
      }

      // Destructure 'item' out, and collect the rest into 'itemWithoutProtocolName'
      const { protocol_name, ...itemWithoutProtocolName } = item;

      return {
        ...itemWithoutProtocolName,
        bus_protocol_id: protocolId, // Bound dynamically to the target key
        managed: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    // 3. Inject payload parameters into table
    await queryInterface.bulkInsert('interfaces', payload, {});
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    // Purge exactly matching records via fast index matching array range
    await queryInterface.bulkDelete(
      'interfaces',
      {
        name: {
          [Op.in]: data.map((item) => item.name)
        }
      },
      {}
    );
  },
};
