'use strict';

const data = [
  // --- Type 1 Hypervisors / Virtualization Layers ---
  {
    id: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    name: 'Proxmox VE',
    vendor: 'Proxmox Server Solutions',
    family: 'Debian',
    major_version: 8,
    minor_version: null,
    eol_date: null, // Rolling release, no fixed EOL
  },
  {
    id: '019f5431-1bf4-7b82-aad1-c5e81def5e3a',
    name: 'VMware ESXi',
    vendor: 'Broadcom',
    family: 'ESXi',
    major_version: 8,
    minor_version: 0,
    eol_date: '2027-10-11',
  },
  {
    id: '019f5431-1bf4-772d-b3e7-00657c8972ea',
    name: 'XCP-ng',
    vendor: 'Vates',
    family: 'Xen',
    major_version: 8,
    minor_version: 2,
    eol_date: null,
  },

  // --- Specialized Storage / NAS Operating Systems ---
  {
    id: '019f5431-1bf4-7e4c-b9c0-954355a3e544',
    name: 'TrueNAS SCALE',
    vendor: 'iXsystems',
    family: 'Debian',
    major_version: 24,
    minor_version: 4,
    eol_date: null,
  },
  {
    id: '019f5431-1bf4-71f6-b6c1-dde5384cea57',
    name: 'TrueNAS CORE',
    vendor: 'iXsystems',
    family: 'FreeBSD',
    major_version: 13,
    minor_version: 0,
    eol_date: null,
  },
  {
    id: '019f5431-1bf4-72fd-a9c0-5a396eb14ea1',
    name: 'Unraid',
    vendor: 'Lime Technology',
    family: 'Slackware',
    major_version: 7,
    minor_version: 0,
    eol_date: null,
  },

  // --- Enterprise & Homelab Linux Distributions ---
  // Debian: only releases still inside full/LTS support are listed
  // (Debian 11 "Bullseye" reached EOL on 2026-08-31).
  {
    id: '019f5431-1bf4-74cf-8da9-6c3905bb4e2d',
    name: 'Debian 12',
    code_name: 'Bookworm',
    vendor: 'The Debian Project',
    family: 'Debian',
    major_version: 12,
    minor_version: null,
    eol_date: '2028-06-30', // End of Debian LTS
  },
  {
    id: '019f5431-1bf4-7a01-8b0c-1d2e3f4a5b60',
    name: 'Debian 13',
    code_name: 'Trixie',
    vendor: 'The Debian Project',
    family: 'Debian',
    major_version: 13,
    minor_version: null,
    eol_date: '2030-06-30', // End of Debian LTS
  },
  // Ubuntu: only LTS releases still under standard security maintenance are
  // listed (20.04 "Focal" ended standard support on 2025-05-31; 18.04 and
  // older are EOL; interim releases like 25.10 expire within ~9 months).
  {
    id: '019f5431-1bf4-7b12-9c1d-2e3f4a5b6c71',
    name: 'Ubuntu 22.04 LTS',
    code_name: 'Jammy Jellyfish',
    vendor: 'Canonical',
    family: 'Debian',
    major_version: 22,
    minor_version: 4,
    eol_date: '2027-05-31', // End of standard security maintenance
  },
  {
    id: '019f5431-1bf4-73bc-9d1a-5b32e0bc2754',
    name: 'Ubuntu 24.04 LTS',
    code_name: 'Noble Numbat',
    vendor: 'Canonical',
    family: 'Debian',
    major_version: 24,
    minor_version: 4,
    eol_date: '2029-05-31', // End of standard security maintenance
  },
  {
    id: '019f5431-1bf4-7c23-8d2e-3f4a5b6c7d82',
    name: 'Ubuntu 26.04 LTS',
    code_name: 'Resolute Raccoon',
    vendor: 'Canonical',
    family: 'Debian',
    major_version: 26,
    minor_version: 4,
    eol_date: '2031-05-31', // End of standard security maintenance
  },
  {
    id: '019f5431-1bf4-75df-bf82-3d71bc2042ee',
    name: 'Rocky Linux',
    vendor: 'Rocky Enterprise Software Foundation',
    family: 'RHEL',
    major_version: 9,
    minor_version: 0,
    eol_date: '2032-05-31',
  },
  {
    id: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    name: 'Alpine Linux',
    vendor: 'Alpine Linux Development Team',
    family: 'Alpine',
    major_version: 3,
    minor_version: 20,
    eol_date: null,
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
