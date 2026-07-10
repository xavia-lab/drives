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
  tableName: 'form_factors',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'form_factors_name',
      unique: true,
      fields: ['name'],
    },
  ],
})
export class FormFactor extends Model {
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
    type: DataType.DECIMAL(4, 1),
    allowNull: true,
    field: 'slot_pitch_mm',
  })
  declare slotPitch: number;

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
export type FormFactorCreateAttributes = Pick<
  FormFactor,
  'name' | 'slotPitch' | 'managed'
>;
