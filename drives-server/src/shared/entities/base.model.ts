import {
  Column,
  Model,
  PrimaryKey,
  DataType,
  Default,
} from 'sequelize-typescript';
import sequelize from 'sequelize';

// 🌟 FIX: Remove class-level generics so it satisfies the compiler's strict 'typeof Model' constraints
export abstract class BaseModel extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7'))
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    unique: true,
    field: 'display_key',
  })
  declare displayKey: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
