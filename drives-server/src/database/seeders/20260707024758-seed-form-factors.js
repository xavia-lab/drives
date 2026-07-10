'use strict';

const data = [
  // --- Legacy & Mechanical Standards ---
  { name: '3.5-inch LFF', slot_pitch_mm: 26.1 }, // Standard high-capacity spinning HDDs
  { name: '2.5-inch SFF', slot_pitch_mm: 15.0 }, // Enterprise SATA/SAS SSDs and older HDDs

  // --- M.2 Form Factors (Typically Boot Drives) ---
  { name: 'M.2 2280', slot_pitch_mm: 4.0 },     // Consumer/Boot NVMe standard
  { name: 'M.2 22110', slot_pitch_mm: 4.0 },    // Enterprise M.2 with Power Loss Protection (PLP)

  // --- PCIe Add-In Cards ---
  { name: 'AIC HHHL', slot_pitch_mm: 18.7 },     // Half-Height Half-Length Add-In Card (e.g., older Optane)

  // --- EDSFF E1 Standards (Optimized for 1U Servers) ---
  { name: 'E1.S 5.9mm', slot_pitch_mm: 5.9 },   // High-density, high-performance 1U NVMe SSDs
  { name: 'E1.S 9.5mm', slot_pitch_mm: 9.5 },   // Symmetric enclosure with improved thermals
  { name: 'E1.S 15mm', slot_pitch_mm: 15.0 },   // Thick asymmetric heatsink for high-wattage NVMe

  // --- EDSFF E3 Standards (Optimized for 2U Servers & CXL Devices) ---
  { name: 'E3.S 2T 7.5mm', slot_pitch_mm: 7.5 },  // Mainstream 2U enterprise flash standard
  { name: 'E3.S 2T 16.8mm', slot_pitch_mm: 16.8 }, // Thick form factor for high-power CXL memory expanders
  { name: 'E3.L 2T 7.5mm', slot_pitch_mm: 7.5 }    // Long variant for maximum capacity/flash chips
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'form_factors',
      data.map((item) => ({
        name: item.name,
        slot_pitch_mm: item.slot_pitch_mm,
        managed: true,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'form_factors',
      {
        name: {
          [Op.in]: data.map((item) => item.name)
        }
      },
      {},
    );
  },
};
