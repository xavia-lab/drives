import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Country } from '../../country/entities/country.entity';
// Import your StorageModel entity path here when ready
// import { StorageModel } from '../../storage-model/entities/storage-model.entity';

@Table({ tableName: 'vendors', timestamps: true, underscored: true })
export class Vendor extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

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

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  @ForeignKey(() => Country)
  @Column({
    type: DataType.INTEGER,
    field: 'country_id',
    allowNull: false,
  })
  declare countryId: number;

  @BelongsTo(() => Country, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  declare country: Country;

  // Uncomment this relationship once you construct your StorageModel Nest entity
  // @HasMany(() => StorageModel)
  // declare storageModels: StorageModel[];
}
