import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { Vendor } from '../../vendor/entities/vendor.entity';

// Instruction-set architecture implemented by the CPU. This is intentionally
// separate from the vendor: "ARM" is an ISA licensed to many chip makers
// (Apple, Ampere, Qualcomm, ...), not a manufacturer itself.
export enum CpuArchitecture {
  X86_64 = 'X86_64',
  ARM64 = 'ARM64',
}

@Table({
  tableName: 'cpu_models',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
  indexes: [
    {
      name: 'cpu_models_vendor_id_idx',
      fields: ['vendor_id'],
    },
  ],
})
export class CpuModel extends BaseModel {
  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'vendor_id',
  })
  declare vendorId: string;

  @BelongsTo(() => Vendor, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare vendor: Vendor;

  @Column({
    type: DataType.ENUM(...Object.values(CpuArchitecture)),
    allowNull: false,
  })
  declare architecture: CpuArchitecture;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true, // e.g., 'EPYC 7763' or 'Xeon Gold 6330'
  })
  declare name: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false, // e.g., 64, 28
  })
  declare physicalCores: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false, // e.g., 128, 56
  })
  declare threads: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true, // For data center power consumption auditing
    field: 'tdp_watts',
  })
  declare tdpWatts: number | null;
}
