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

import { Vendor } from '../../vendor/entities/vendor.entity';
import { StorageType } from '../../storage-type/entities/storage-type.entity';
import { FormFactor } from '../../form-factor/entities/form-factor.entity';
import { Interface } from '../../interface/entities/interface.entity';
import { Capacity } from '../../capacity/entities/capacity.entity';

@Table({
  tableName: 'storage_models',
  timestamps: true,
  underscored: true, // Aligns JavaScript camelCase columns with your database snake_case fields
  indexes: [
    {
      name: 'storage_models_unique_spec_idx',
      fields: ['manufacturer_id', 'name', 'model_number'],
      unique: true,
    },
    {
      name: 'storage_models_type_idx',
      fields: ['storage_type_id'],
    },
    {
      name: 'storage_models_form_factor_idx',
      fields: ['form_factor_id'],
    },
    {
      name: 'storage_models_interface_idx',
      fields: ['interface_id'],
    },
    {
      name: 'storage_models_capacity_idx',
      fields: ['capacity_id'],
    },
  ],
})
export class StorageModel extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string; // Changed type from number to string

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    field: 'name',
  })
  declare name: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    field: 'model_number',
  })
  declare modelNumber: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true, // Nullable for Magnetic spinners, populated for Solid State/Optane pools
    field: 'max_endurance_tbw',
  })
  declare maxEnduranceTbw: number | null;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.getDataValue('name')} | ${this.getDataValue('modelNumber')}`;
  }

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Foreign Keys and Associations ---

  // 1. Manufacturer Relationship
  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'manufacturer_id',
  })
  declare manufacturerId: string;

  @BelongsTo(() => Vendor, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare manufacturer: Vendor;

  // 2. Storage Type Relationship
  @ForeignKey(() => StorageType)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'storage_type_id',
  })
  declare storageTypeId: string;

  @BelongsTo(() => StorageType, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare storageType: StorageType;

  // 3. Form Factor Relationship
  @ForeignKey(() => FormFactor)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'form_factor_id',
  })
  declare formFactorId: string;

  @BelongsTo(() => FormFactor, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare formFactor: FormFactor;

  // 4. Interface Relationship
  @ForeignKey(() => Interface)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'interface_id',
  })
  declare interfaceId: string;

  @BelongsTo(() => Interface, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare interface: Interface;

  // 5. Capacity Relationship
  @ForeignKey(() => Capacity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'capacity_id',
  })
  declare capacityId: string;

  @BelongsTo(() => Capacity, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare capacity: Capacity;
}
