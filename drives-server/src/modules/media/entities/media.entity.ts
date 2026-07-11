import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  // BelongsToMany, // Uncomment when ready to use associations
} from 'sequelize-typescript';
import sequelize from 'sequelize';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  CERTIFICATE = 'CERTIFICATE',
  QR_CODE = 'QR_CODE',
  LABEL = 'LABEL',
}

@Table({
  tableName: 'media',
  timestamps: true,
  paranoid: true,
  underscored: true, // Automatically converts camelCase fields to snake_case in the DB
  indexes: [
    {
      name: 'media_media_type_idx',
      fields: ['media_type'], // Adjusted to snake_case database field name
      using: 'btree',
    },
    {
      name: 'media_file_id_uidx', // Renamed for architectural consistency
      unique: true,
      fields: ['file_id'], // Adjusted to snake_case database field name
      using: 'btree',
    },
  ],
})
export class Media extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string; // Changed type from number to string

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    field: 'file_id', // Explicit database column mapping
    comment:
      'This is the SHA-256 hash of the file and used as file_id for content retrieval',
  })
  declare fileId: string; // SHA-256 hash

  @Column({
    type: DataType.ENUM(...Object.values(MediaType)),
    defaultValue: MediaType.IMAGE,
    allowNull: false,
    field: 'media_type', // Explicit database column mapping
  })
  declare mediaType: MediaType;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'file_name', // Explicit database column mapping
  })
  declare fileName: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'mime_type', // Explicit database column mapping
  })
  declare mimeType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'file_size', // Explicit database column mapping
  })
  declare fileSize: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Image metadata (dimensions, alt text, caption, etc.)',
  })
  declare metadata: Record<string, any>;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date;

  // Associations (Keep string-based or update when mapping bridge tables to UUIDv7)
  // @BelongsToMany(() => Product, () => ProductMedia)
  // declare products: Product[];

  // @BelongsToMany(() => PurchaseOrder, () => PurchaseOrderMedia)
  // declare purchaseOrders: PurchaseOrder[];

  // @BelongsToMany(() => Allocation, () => AllocationMedia)
  // declare allocations: Allocation[];
}

// Updated creation attributes type helper (id is optionally accepted for client-side testing/generation)
export type MediaCreateAttributes = Pick<
  Media,
  'mediaType' | 'fileName' | 'mimeType' | 'fileSize' | 'metadata' | 'fileId'
> & {
  id?: string;
};
