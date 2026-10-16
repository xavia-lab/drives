import { Table, Column, DataType, Default } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

@Table({
  tableName: 'roles',
  timestamps: true,
  underscored: true,
})
export class Role extends BaseModel {
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare managed: boolean;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return this.name;
  }
}

// Create a type for creating roles (without Sequelize methods)
export type RoleCreateAttributes = Pick<Role, 'name' | 'managed'>;
