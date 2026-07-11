import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'qrLinks',
  timestamps: true,
  indexes: [
    { name: 'qrLinks_shortId', fields: ['shortId'], unique: true },
    {
      name: 'qrLinks_resourceType_resourceId',
      fields: ['resourceType', 'resourceId'],
      unique: true,
    },
  ],
})
export class QRLink extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING(21),
    allowNull: false,
  })
  declare shortId: string; // e.g., "5kP9zR2"

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare resourceType: string; // e.g., "product", "invoice"

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare resourceId: string; // The original UUID or numerical ID of the resource
}
