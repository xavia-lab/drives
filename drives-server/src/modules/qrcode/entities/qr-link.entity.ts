import { Table, Column, DataType } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

@Table({
  tableName: 'qr_links', // 1. Updated from camelCase to underscores
  timestamps: true,
  underscored: true, // Automatically manages underlying snake_case database timestamp conversions
  indexes: [
    {
      name: 'qr_links_short_id_uidx', // 2. Aligned unique index name
      fields: ['short_id'],
      unique: true,
    },
    {
      name: 'qr_links_resource_type_resource_id_uidx', // 3. Aligned composite unique index name
      fields: ['resource_type', 'resource_id'],
      unique: true,
    },
  ],
})
export class QRLink extends BaseModel {
  @Column({
    type: DataType.STRING(21),
    field: 'short_id',
    allowNull: false,
  })
  declare shortId: string; // e.g., "5kP9zR2"

  @Column({
    type: DataType.STRING(255),
    field: 'resource_type',
    allowNull: false,
  })
  declare resourceType: string; // e.g., "product", "invoice"

  @Column({
    type: DataType.STRING(64),
    field: 'resource_id',
    allowNull: false,
  })
  declare resourceId: string; // The original UUID or numerical ID of the resource
}

// Creation attributes type helper supporting optional client-generated IDs
export type QRLinkCreateAttributes = Pick<
  QRLink,
  'shortId' | 'resourceType' | 'resourceId'
> & {
  id?: string;
};
