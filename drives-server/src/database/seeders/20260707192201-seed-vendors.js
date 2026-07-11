'use strict';

const vendors = [
  // --- Manufacturers ---
  { name: 'Samsung Electronics', country_name: 'South Korea', is_manufacturer: true, is_retailer: false, support_contact_email: 'enterprise.support@samsung.com' },
  { name: 'Solidigm', country_name: 'United States', is_manufacturer: true, is_retailer: false, support_contact_email: 'rma@solidigm.com' },
  { name: 'Kioxia', country_name: 'Japan', is_manufacturer: true, is_retailer: false, support_contact_email: 'storage.support@kioxia.com' },
  { name: 'Seagate Technology', country_name: 'United States', is_manufacturer: true, is_retailer: false, support_contact_email: 'exos.support@seagate.com' },
  { name: 'Western Digital', country_name: 'United States', is_manufacturer: true, is_retailer: false, support_contact_email: 'wd.enterprise@wdc.com' },
  { name: 'Toshiba', country_name: 'Japan', is_manufacturer: true, is_retailer: false, support_contact_email: 'storage.support@toshiba.com' },
  { name: 'Hitachi', country_name: 'Japan', is_manufacturer: true, is_retailer: false, support_contact_email: 'support@hitachi-storage.com' },
  { name: 'Intel', country_name: 'United States', is_manufacturer: true, is_retailer: false, support_contact_email: 'supportcodes@intel.com' },
  { name: 'ADATA', country_name: 'Taiwan', is_manufacturer: true, is_retailer: false, support_contact_email: 'support@adata.com' },
  { name: 'TEAMGROUP', country_name: 'Taiwan', is_manufacturer: true, is_retailer: false, support_contact_email: 'support@teamgroup.com.tw' },
  
  // --- Retailers / Regional IT Distributors ---
  { name: 'CDW Logistics', country_name: 'United States', is_manufacturer: false, is_retailer: true, support_contact_email: 'corporate.rma@cdw.com' },
  { name: 'SHI International', country_name: 'United States', is_manufacturer: false, is_retailer: true, support_contact_email: 'datacenterteam@shi.com' },
  { name: 'Softcat plc', country_name: 'United Kingdom', is_manufacturer: false, is_retailer: true, support_contact_email: 'uk.datacenter@softcat.com' },
  { name: 'Insight UK', country_name: 'United Kingdom', is_manufacturer: false, is_retailer: true, support_contact_email: 'uk.returns@insight.com' },
  
  // --- Global Retailers (Split by Region for Financial Routing) ---
  { name: 'Amazon US', country_name: 'United States', is_manufacturer: false, is_retailer: true, support_contact_email: 'b2b-support@amazon.com' },
  { name: 'Amazon UK', country_name: 'United Kingdom', is_manufacturer: false, is_retailer: true, support_contact_email: 'b2b-support@amazon.co.uk' },
  { name: 'Newegg Business', country_name: 'United States', is_manufacturer: false, is_retailer: true, support_contact_email: 'bizsupport@newegg.com' },
  
  // --- Specialized / Refurbished Enterprise Suppliers ---
  { name: 'Max Digital Data', country_name: 'United States', is_manufacturer: false, is_retailer: true, support_contact_email: 'support@maxdigitaldata.com' }
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Fetch live country code map from database
    const [countries] = await queryInterface.sequelize.query(
      'SELECT id, code, name FROM countries;'
    );

    const countryMap = countries.reduce((acc, row) => {
      acc[row.name] = row.id;
      return acc;
    }, {});

    // 2. Prepare payload resolving string labels into relational keys
    const payload = vendors.map((v) => {
      const country_id = countryMap[v.country_name];
      
      if (!country_id) {
        throw new Error(`Foreign Key Missing: Country '${v.country_name}' must be initialized in the 'countries' table before running this vendor seed pack.`);
      }

      return {
        name: v.name,
        country_id: country_id,
        is_manufacturer: v.is_manufacturer,
        is_retailer: v.is_retailer,
        support_contact_email: v.support_contact_email,
        managed: true,
        created_at: new Date(),
        updated_at: new Date()
      };
    });

    await queryInterface.bulkInsert('vendors', payload, {});
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    
    await queryInterface.bulkDelete('vendors', {
      name: {
        [Op.in]: vendors.map((v) => v.name)
      }
    }, {});
  },
};
