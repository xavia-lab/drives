import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
// import { Product } from '../../product/entities/product.entity';
// import { ProductMedia } from '../../product/entities/product-media.entity';
// import { PurchaseOrder } from '../../purchase-order/entities/purchase-order.entity';
// import { PurchaseOrderMedia } from '../../purchase-order/entities/purchase-order-media.entity';
// import { Allocation } from '../../allocation/entities/allocation.entity';
// import { AllocationMedia } from '../../allocation/entities/allocation-media.entity';

@Table({
  tableName: 'media',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['mediaType'] },
    {
      name: 'unique_media_file_id',
      unique: true,
      fields: ['fileId'],
    },
  ],
})
export class Media extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment:
      'This is the SHA-256 hash of the file and used is fileId for content retrieval',
  })
  declare fileId: string; // SHA-256 hash

  @Column({
    type: DataType.ENUM(
      'IMAGE',
      'VIDEO',
      'DOCUMENT',
      'CERTIFICATE',
      'QR_CODE',
      'LABEL',
    ),
    defaultValue: 'IMAGE',
    allowNull: false,
  })
  declare mediaType:
    'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'CERTIFICATE' | 'QR_CODE' | 'LABEL';

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare fileName: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare mimeType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare fileSize: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Image metadata (dimensions, alt text, caption, etc.)',
  })
  declare metadata: Record<string, any>;

  declare readonly createdAt: Date;
  declare readonly deletedAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  // @BelongsToMany(() => Product, () => ProductMedia)
  // declare products: Product[];

  // @BelongsToMany(() => PurchaseOrder, () => PurchaseOrderMedia)
  // declare purchaseOrders: PurchaseOrder[];

  // @BelongsToMany(() => Allocation, () => AllocationMedia)
  // declare allocations: Allocation[];
}

export type MediaCreateAttributes = Pick<
  Media,
  'mediaType' | 'fileName' | 'mimeType' | 'fileSize' | 'metadata' | 'fileId'
>;
