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
  tableName: 'currencies',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'currencies_name',
      unique: true,
      fields: ['name'],
    },
    {
      name: 'currencies_code',
      unique: true,
      fields: ['code'],
    },
  ],
})
export class Currency extends Model {
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
    type: DataType.STRING(3),
    allowNull: false,
  })
  declare code: string;

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
  })
  declare symbol: string;

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

// Create a type for creating currencies (without Sequelize methods)
export type CurrencyCreateAttributes = Pick<
  Currency,
  'name' | 'code' | 'symbol' | 'managed'
>;
