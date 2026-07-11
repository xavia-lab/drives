import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  Default,
} from 'sequelize-typescript';
import sequelize from 'sequelize';

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
export class StorageType extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string; // Changed type from number to string

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

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

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
