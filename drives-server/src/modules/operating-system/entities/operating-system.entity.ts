import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import sequelize from 'sequelize';

@Table({
  tableName: 'operating_systems',
  timestamps: true,
  underscored: true,
})
export class OperatingSystem extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7'))
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare vendor: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Associations ---
}
