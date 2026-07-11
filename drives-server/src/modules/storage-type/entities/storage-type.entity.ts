import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'storage_types',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'storage_types_name',
      fields: ['name'],
    },
  ],
})
export class StorageType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

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

// Create a type for creating currencies (without Sequelize methods)
export type StorageTypeCreateAttributes = Pick<
  StorageType,
  'name' | 'wearTrackable' | 'managed'
>;
