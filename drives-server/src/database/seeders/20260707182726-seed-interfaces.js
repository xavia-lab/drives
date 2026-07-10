'use strict';

const data = [
  // --- SATA ---
  { name: 'SATA I', protocol_name: 'SATA', link_generation: 1, throughput_gbps: 1.5 },
  { name: 'SATA II', protocol_name: 'SATA', link_generation: 2, throughput_gbps: 3.0 },
  { name: 'SATA III', protocol_name: 'SATA', link_generation: 3, throughput_gbps: 6.0 },

  // --- SAS ---
  { name: 'SAS 3G', protocol_name: 'SAS', link_generation: 1, throughput_gbps: 3.0 },
  { name: 'SAS 6G', protocol_name: 'SAS', link_generation: 2, throughput_gbps: 6.0 },
  { name: 'SAS 12G', protocol_name: 'SAS', link_generation: 3, throughput_gbps: 12.0 },
  { name: 'SAS 24G', protocol_name: 'SAS', link_generation: 4, throughput_gbps: 24.0 },

  // --- NVMe (Enterprise x4 Lane Configurations) ---
  { name: 'NVMe Gen 3.0 x4', protocol_name: 'NVMe', link_generation: 3, throughput_gbps: 31.5 },
  { name: 'NVMe Gen 4.0 x4', protocol_name: 'NVMe', link_generation: 4, throughput_gbps: 63.0 },
  { name: 'NVMe Gen 5.0 x4', protocol_name: 'NVMe', link_generation: 5, throughput_gbps: 126.0 },
  { name: 'NVMe Gen 6.0 x4', protocol_name: 'NVMe', link_generation: 6, throughput_gbps: 242.0 },

  // --- CXL (Enterprise Storage / Memory Expanders) ---
  { name: 'CXL 1.1 / 2.0 (x8)', protocol_name: 'CXL', link_generation: 1, throughput_gbps: 252.0 },
  { name: 'CXL 1.1 / 2.0 (x16)', protocol_name: 'CXL', link_generation: 2, throughput_gbps: 504.0 },
  { name: 'CXL 3.0 (x8)', protocol_name: 'CXL', link_generation: 3, throughput_gbps: 504.0 },
  { name: 'CXL 3.0 (x16)', protocol_name: 'CXL', link_generation: 4, throughput_gbps: 1008.0 }
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
        throw new Error(`Foreign Key Missing: Protocol '${item.protocol_name}' must exist in 'bus_protocols' before executing this seed packet.`);
      }

      return {
        name: item.name,
        bus_protocol_id: protocolId, // Bound dynamically to the target key
        link_generation: item.link_generation,
        throughput_gbps: item.throughput_gbps,
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
