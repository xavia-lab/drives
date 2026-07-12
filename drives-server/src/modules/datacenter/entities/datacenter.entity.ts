import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import sequelize from 'sequelize';

import { Country } from '../../country/entities/country.entity';

@Table({
  tableName: 'datacenters',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
  // 🌟 Added: Explicit class-level database index configuration mapping
  indexes: [
    {
      name: 'datacenters_country_id_idx',
      using: 'btree',
      fields: ['country_id'],
    },
  ],
})
export class Datacenter extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    unique: true, // Facility naming key (e.g., 'VA-ASH-1')
  })
  declare code: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false, // User friendly description
  })
  declare name: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false, // e.g., 'Ashburn'
  })
  declare city: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => Country)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'country_id',
  })
  declare countryId: string;

  @BelongsTo(() => Country, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare country: Country;
}
