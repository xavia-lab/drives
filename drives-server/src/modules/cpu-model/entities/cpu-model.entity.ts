import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import sequelize from 'sequelize';

// Define a structural TypeScript enum matching your explicit database ENUM constraints
export enum CpuVendor {
  AMD = 'AMD',
  INTEL = 'INTEL',
  ARM = 'ARM',
}

@Table({
  tableName: 'cpu_models',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
})
export class CpuModel extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(CpuVendor)),
    allowNull: false,
  })
  declare vendor: CpuVendor;

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

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
