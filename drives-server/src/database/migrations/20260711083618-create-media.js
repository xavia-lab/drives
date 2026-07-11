'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the 'media' table with UUIDv7
    await queryInterface.createTable('media', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        // Uses PostgreSQL's native uuidv7 function to auto-generate IDs
        defaultValue: Sequelize.literal('uuidv7()'),
      },
      file_id: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment:
          'This is the SHA-256 hash of the file and used as file_id for content retrieval',
      },
      media_type: {
        type: Sequelize.ENUM(
          'IMAGE',
          'VIDEO',
          'DOCUMENT',
          'CERTIFICATE',
          'QR_CODE',
          'LABEL',
        ),
        defaultValue: 'IMAGE',
        allowNull: false,
      },
      file_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      mime_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Image metadata (dimensions, alt text, caption, etc.)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true, // Required to support Sequelize paranoid (soft delete) mode
      },
    });

    // 2. Performance & Integrity Indexes
    await queryInterface.addIndex('media', ['media_type'], {
      name: 'media_media_type_idx',
      using: 'btree',
    });

    await queryInterface.addIndex('media', ['file_id'], {
      name: 'media_file_id_uidx',
      unique: true,
      using: 'btree',
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Drop the table cleanly
    await queryInterface.dropTable('media');

    // 2. Drop the generated localized enum type to keep the database schema clean
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_media_media_type";`,
    );
  },
};
