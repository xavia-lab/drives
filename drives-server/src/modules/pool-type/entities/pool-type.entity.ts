import { Table, Column, DataType, Default } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

@Table({
  tableName: 'pool_types',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'pool_types_name',
      unique: true,
      fields: ['name'],
    },
  ],
})
export class PoolType extends BaseModel {
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  declare name: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare managed: boolean;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.name}`;
  }
}

// Create a type for creating pool types (without Sequelize methods)
export type PoolTypeCreateAttributes = Pick<PoolType, 'name' | 'managed'>;
