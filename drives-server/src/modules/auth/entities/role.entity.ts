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
  tableName: 'roles',
  timestamps: true,
})
export class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
  })
  declare name: string;

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
