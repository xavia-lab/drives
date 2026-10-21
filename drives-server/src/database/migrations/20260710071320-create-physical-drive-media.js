'use strict';

/**
 * Join table attaching content-store media records to physical drives.
 * The media row owns the content hash/file metadata; this row owns the
 * attachment purpose and presentation metadata.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await queryInterface.tableExists('physical_drive_media'))) {
      await queryInterface.createTable('physical_drive_media', {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('uuidv7()'),
        },
        display_key: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          unique: true,
        },
        physical_drive_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'physical_drives',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        media_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'media',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        attachment_type: {
          type: Sequelize.ENUM(
            'PICTURE',
            'INVOICE',
            'DOCUMENT',
            'CERTIFICATE',
            'OTHER',
          ),
          allowNull: false,
          defaultValue: 'OTHER',
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        sort_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
    }

    const indexes = await queryInterface.showIndex('physical_drive_media');
    const indexNames = new Set(indexes.map((index) => index.name));

    if (!indexNames.has('physical_drive_media_drive_media_unique_idx')) {
      await queryInterface.addIndex(
        'physical_drive_media',
        ['physical_drive_id', 'media_id'],
        {
          name: 'physical_drive_media_drive_media_unique_idx',
          unique: true,
          using: 'btree',
        },
      );
    }

    if (!indexNames.has('physical_drive_media_drive_idx')) {
      await queryInterface.addIndex(
        'physical_drive_media',
        ['physical_drive_id', 'attachment_type'],
        {
          name: 'physical_drive_media_drive_idx',
          using: 'btree',
        },
      );
    }

    if (!indexNames.has('physical_drive_media_media_idx')) {
      await queryInterface.addIndex('physical_drive_media', ['media_id'], {
        name: 'physical_drive_media_media_idx',
        using: 'btree',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('physical_drive_media');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_physical_drive_media_attachment_type";`,
    );
  },
};
