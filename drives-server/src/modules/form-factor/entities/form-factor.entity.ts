import { Table, Column, DataType, Default } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

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
export class FormFactor extends BaseModel {
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

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.name}`;
  }
}

// Updated creation attributes type helper (id is automatically omitted as it defaults)
export type FormFactorCreateAttributes = Pick<
  FormFactor,
  'name' | 'slotPitch' | 'managed'
>;
