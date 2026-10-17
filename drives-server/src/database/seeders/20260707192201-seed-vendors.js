'use strict';

const vendors = [
  // --- Manufacturers ---
  {
    id: '019f52ee-f44f-714a-9c95-49863edafa87',
    name: 'Samsung Electronics',
    country_name: 'South Korea',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'enterprise.support@samsung.com',
  },
  {
    id: '019f52ee-f450-7971-bffe-0873a0fa1181',
    name: 'Solidigm',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'rma@solidigm.com',
  },
  {
    id: '019f52ee-f450-7eba-b43f-5a305cdc2890',
    name: 'Kioxia',
    country_name: 'Japan',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'storage.support@kioxia.com',
  },
  {
    id: '019f52ee-f450-770a-832b-778ff77da032',
    name: 'Seagate Technology',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'exos.support@seagate.com',
  },
  {
    id: '019f52ee-f450-70b0-b85c-4a97001681b5',
    name: 'Western Digital',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'wd.enterprise@wdc.com',
  },
  {
    id: '019f52ee-f450-7a91-b284-9b0659f9ada3',
    name: 'Toshiba',
    country_name: 'Japan',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'storage.support@toshiba.com',
  },
  {
    id: '019f52ee-f450-7990-8a42-f972ff7dc4df',
    name: 'Hitachi',
    country_name: 'Japan',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@hitachi-storage.com',
  },
  {
    id: '019f52ee-f450-7484-b126-fed1b64c566e',
    name: 'Intel',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'supportcodes@intel.com',
  },
  {
    id: '019f52ee-f450-7aa2-a40f-616c20e04793',
    name: 'ADATA',
    country_name: 'Taiwan',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@adata.com',
  },
  {
    id: '019f52ee-f450-76b2-b963-0398ba6a83da',
    name: 'TEAMGROUP',
    country_name: 'Taiwan',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@teamgroup.com.tw',
  },

  // --- CPU Vendors: x86_64 ---
  {
    id: '019f52ee-f450-7c01-8a01-000000000001',
    name: 'AMD',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'enterprise.support@amd.com',
  },
  {
    id: '019f52ee-f450-7c02-8a02-000000000002',
    name: 'VIA Technologies',
    country_name: 'Taiwan',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@via.com.tw',
  },
  {
    id: '019f52ee-f450-7c03-8a03-000000000003',
    name: 'Zhaoxin',
    country_name: 'China',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@zhaoxin.com',
  },
  {
    id: '019f52ee-f450-7c04-8a04-000000000004',
    name: 'Hygon',
    country_name: 'China',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@hygon.cn',
  },

  // --- CPU Vendors: ARM64 ---
  {
    id: '019f52ee-f450-7c05-8a05-000000000005',
    name: 'Apple',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'enterprise@apple.com',
  },
  {
    id: '019f52ee-f450-7c06-8a06-000000000006',
    name: 'Ampere Computing',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@amperecomputing.com',
  },
  {
    id: '019f52ee-f450-7c07-8a07-000000000007',
    name: 'Qualcomm',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@qualcomm.com',
  },
  {
    id: '019f52ee-f450-7c08-8a08-000000000008',
    name: 'NVIDIA',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'enterprise.support@nvidia.com',
  },
  {
    id: '019f52ee-f450-7c09-8a09-000000000009',
    name: 'Broadcom',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@broadcom.com',
  },
  {
    id: '019f52ee-f450-7c0a-8a0a-00000000000a',
    name: 'Marvell Technology',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@marvell.com',
  },
  {
    id: '019f52ee-f450-7c0b-8a0b-00000000000b',
    name: 'Texas Instruments',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@ti.com',
  },
  {
    id: '019f52ee-f450-7c0c-8a0c-00000000000c',
    name: 'Google',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'cloud-support@google.com',
  },
  {
    id: '019f52ee-f450-7c0d-8a0d-00000000000d',
    name: 'Microsoft',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@microsoft.com',
  },
  {
    id: '019f52ee-f450-7c0e-8a0e-00000000000e',
    name: 'Amazon Web Services',
    country_name: 'United States',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'aws-support@amazon.com',
  },
  {
    id: '019f52ee-f450-7c0f-8a0f-00000000000f',
    name: 'Fujitsu',
    country_name: 'Japan',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@fujitsu.com',
  },
  {
    id: '019f52ee-f450-7c10-8a10-000000000010',
    name: 'MediaTek',
    country_name: 'Taiwan',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@mediatek.com',
  },
  {
    id: '019f52ee-f450-7c11-8a11-000000000011',
    name: 'Rockchip',
    country_name: 'China',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@rock-chips.com',
  },
  {
    id: '019f52ee-f450-7c12-8a12-000000000012',
    name: 'Huawei',
    country_name: 'China',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@huawei.com',
  },
  {
    id: '019f52ee-f450-7c13-8a13-000000000013',
    name: 'Alibaba Cloud',
    country_name: 'China',
    is_manufacturer: true,
    is_retailer: false,
    support_contact_email: 'support@alibabacloud.com',
  },

  // --- Retailers / Regional IT Distributors ---
  {
    id: '019f52ee-f450-73f3-a9b7-896080b22fba',
    name: 'CDW Logistics',
    country_name: 'United States',
    is_manufacturer: false,
    is_retailer: true,
    support_contact_email: 'corporate.rma@cdw.com',
  },
  {
    id: '019f52ee-f450-7643-848b-06bc3754502d',
    name: 'SHI International',
    country_name: 'United States',
    is_manufacturer: false,
    is_retailer: true,
    support_contact_email: 'datacenterteam@shi.com',
  },
  {
    id: '019f52ee-f450-764c-af66-b8d361e589dc',
    name: 'Softcat plc',
    country_name: 'United Kingdom',
    is_manufacturer: false,
    is_retailer: true,
    support_contact_email: 'uk.datacenter@softcat.com',
  },
  {
    id: '019f52ee-f450-7208-8c2c-a35b7038e199',
    name: 'Insight UK',
    country_name: 'United Kingdom',
    is_manufacturer: false,
    is_retailer: true,
    support_contact_email: 'uk.returns@insight.com',
  },

  // --- Global Retailers (Split by Region for Financial Routing) ---
  {
    id: '019f52ee-f450-756a-8587-e30bc21c8ac6',
    name: 'Amazon US',
    country_name: 'United States',
    is_manufacturer: false,
    is_retailer: true,
    support_contact_email: 'b2b-support@amazon.com',
  },
  {
    id: '019f52ee-f450-71bb-b19a-7e11a38f0b65',
    name: 'Amazon UK',
    country_name: 'United Kingdom',
    is_manufacturer: false,
    is_retailer: true,
    support_contact_email: 'b2b-support@amazon.co.uk',
  },
  {
    id: '019f52ee-f450-78d0-a9c4-7caf15e25429',
    name: 'Newegg Business',
    country_name: 'United States',
    is_manufacturer: false,
    is_retailer: true,
    support_contact_email: 'bizsupport@newegg.com',
  },

  // --- Specialized / Refurbished Enterprise Suppliers ---
  {
    id: '019f52ee-f450-722a-9e06-98097344d25d',
    name: 'Max Digital Data',
    country_name: 'United States',
    is_manufacturer: false,
    is_retailer: true,
    support_contact_email: 'support@maxdigitaldata.com',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Fetch live country code map from database
    const [countries] = await queryInterface.sequelize.query(
      'SELECT id, code, name FROM countries;',
    );

    const countryMap = countries.reduce((acc, row) => {
      acc[row.name] = row.id;
      return acc;
    }, {});

    // 2. Prepare payload resolving string labels into relational keys
    const payload = vendors.map((item) => {
      const country_id = countryMap[item.country_name];

      if (!country_id) {
        throw new Error(
          `Foreign Key Missing: Country '${item.country_name}' must be initialized in the 'countries' table before running this vendor seed pack.`,
        );
      }

      // Destructure 'item' out, and collect the rest into 'itemWithoutCountryName'
      const { country_name, ...itemWithoutCountryName } = item;

      return {
        ...itemWithoutCountryName,
        country_id: country_id,
        managed: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    await queryInterface.bulkInsert('vendors', payload, {});
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'vendors',
      {
        name: {
          [Op.in]: vendors.map((v) => v.name),
        },
      },
      {},
    );
  },
};
