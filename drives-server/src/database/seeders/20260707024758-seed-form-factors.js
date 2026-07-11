'use strict';

const data = [
  // --- Legacy & Mechanical Standards ---
  {
    id: '019f52ba-73a1-7fc3-a614-9a28d1e4d16b',
    name: '3.5-inch LFF',
    slot_pitch_mm: 26.1,
  }, // Standard high-capacity spinning HDDs
  {
    id: '019f52ba-73a1-7e29-ad12-eeb81818a3e7',
    name: '2.5-inch SFF',
    slot_pitch_mm: 15.0,
  }, // Enterprise SATA/SAS SSDs and older HDDs

  // --- M.2 Form Factors (Typically Boot Drives) ---
  {
    id: '019f52ba-73a1-7c59-9675-d90e3d19e097',
    name: 'M.2 2280',
    slot_pitch_mm: 4.0,
  }, // Consumer/Boot NVMe standard
  {
    id: '019f52ba-73a1-7d4d-977e-73b558b93c4a',
    name: 'M.2 22110',
    slot_pitch_mm: 4.0,
  }, // Enterprise M.2 with Power Loss Protection (PLP)

  // --- PCIe Add-In Cards ---
  {
    id: '019f52ba-73a1-7d91-bb97-4a88199a18de',
    name: 'AIC HHHL',
    slot_pitch_mm: 18.7,
  }, // Half-Height Half-Length Add-In Card (e.g., older Optane)

  // --- EDSFF E1 Standards (Optimized for 1U Servers) ---
  {
    id: '019f52ba-73a1-7882-b802-30a2a8b0768b',
    name: 'E1.S 5.9mm',
    slot_pitch_mm: 5.9,
  }, // High-density, high-performance 1U NVMe SSDs
  {
    id: '019f52ba-73a1-7b9d-932b-237972f4409f',
    name: 'E1.S 9.5mm',
    slot_pitch_mm: 9.5,
  }, // Symmetric enclosure with improved thermals
  {
    id: '019f52ba-73a1-728c-bbe5-38cd54fbef68',
    name: 'E1.S 15mm',
    slot_pitch_mm: 15.0,
  }, // Thick asymmetric heatsink for high-wattage NVMe

  // --- EDSFF E3 Standards (Optimized for 2U Servers & CXL Devices) ---
  {
    id: '019f52ba-73a1-7f53-9700-b7a3fe5f37ca',
    name: 'E3.S 2T 7.5mm',
    slot_pitch_mm: 7.5,
  }, // Mainstream 2U enterprise flash standard
  {
    id: '019f52ba-73a1-7257-a329-78c3bf967241',
    name: 'E3.S 2T 16.8mm',
    slot_pitch_mm: 16.8,
  }, // Thick form factor for high-power CXL memory expanders
  {
    id: '019f52ba-73a1-72f1-b8e3-78b61ed12503',
    name: 'E3.L 2T 7.5mm',
    slot_pitch_mm: 7.5,
  }, // Long variant for maximum capacity/flash chips
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'form_factors',
      data.map((item) => ({
        ...item,
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
