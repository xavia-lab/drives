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
  tableName: 'countries',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'countries_name',
      unique: true,
      fields: ['name'],
    },
    {
      name: 'countries_code',
      unique: true,
      fields: ['code'],
    },
  ],
})
export class Country extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(2),
    allowNull: false,
  })
  declare code: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare managed: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.code}`;
  }
}

// Create a type for creating countries (without Sequelize methods)
export type CountryCreateAttributes = Pick<
  Country,
  'name' | 'code' | 'managed'
>;
