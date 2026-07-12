'use strict';

const data = [
  // --- Type 1 Hypervisors / Virtualization Layers ---
  {
    id: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    name: 'Proxmox VE',
    vendor: 'Proxmox Server Solutions',
  },
  {
    id: '019f5431-1bf4-7b82-aad1-c5e81def5e3a',
    name: 'VMware ESXi',
    vendor: 'Broadcom',
  },
  {
    id: '019f5431-1bf4-772d-b3e7-00657c8972ea',
    name: 'XCP-ng',
    vendor: 'Vates',
  },

  // --- Specialized Storage / NAS Operating Systems ---
  {
    id: '019f5431-1bf4-7e4c-b9c0-954355a3e544',
    name: 'TrueNAS SCALE',
    vendor: 'iXsystems',
  },
  {
    id: '019f5431-1bf4-71f6-b6c1-dde5384cea57',
    name: 'TrueNAS CORE',
    vendor: 'iXsystems',
  },
  {
    id: '019f5431-1bf4-72fd-a9c0-5a396eb14ea1',
    name: 'Unraid',
    vendor: 'Lime Technology',
  },

  // --- Enterprise & Homelab Linux Distributions ---
  {
    id: '019f5431-1bf4-73bc-9d1a-5b32e0bc2754',
    name: 'Ubuntu Server',
    vendor: 'Canonical',
  },
  {
    id: '019f5431-1bf4-74cf-8da9-6c3905bb4e2d',
    name: 'Debian GNU/Linux',
    vendor: 'The Debian Project',
  },
  {
    id: '019f5431-1bf4-75df-bf82-3d71bc2042ee',
    name: 'Rocky Linux',
    vendor: 'Rocky Enterprise Software Foundation',
  },
  {
    id: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    name: 'Alpine Linux',
    vendor: 'Alpine Linux Development Team',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'operating_systems',
      data.map((item) => ({
        ...item,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      'operating_systems',
      {
        name: {
          [Op.in]: data.map((item) => item.name),
        },
      },
      {},
    );
  },
};
