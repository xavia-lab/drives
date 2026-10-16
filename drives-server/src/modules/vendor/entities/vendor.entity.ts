import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { Country } from '../../country/entities/country.entity';

@Table({ tableName: 'vendors', timestamps: true, underscored: true })
export class Vendor extends BaseModel {
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_manufacturer',
  })
  declare isManufacturer: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_retailer',
  })
  declare isRetailer: boolean;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    field: 'support_contact_email',
    validate: {
      isEmail: true, // Native Sequelize validation rule
    },
  })
  declare supportContactEmail: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'portal_url',
    validate: {
      isUrl: true,
    },
  })
  declare portalUrl: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare managed: boolean;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.getDataValue('name')}`;
  }

  // Associations
  @ForeignKey(() => Country)
  @Column({
    type: DataType.UUID,
    field: 'country_id',
    allowNull: false,
  })
  declare countryId: string;

  @BelongsTo(() => Country, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  declare country: Country;
}
