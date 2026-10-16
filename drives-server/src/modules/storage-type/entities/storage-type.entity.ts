import { Table, Column, DataType, Default } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

@Table({
  tableName: 'storage_types',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'storage_types_name',
      unique: true,
      fields: ['name'],
    },
  ],
})
export class StorageType extends BaseModel {
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'wear_trackable',
  })
  declare wearTrackable: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare managed: boolean;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.name}`;
  }
}

// Updated creation attributes type helper (id is automatically omitted as it defaults)
export type StorageTypeCreateAttributes = Pick<
  StorageType,
  'name' | 'wearTrackable' | 'managed'
>;
