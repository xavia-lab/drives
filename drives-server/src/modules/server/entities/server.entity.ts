import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import sequelize from 'sequelize';

import { CpuModel } from '../../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../../operating-system/entities/operating-system.entity';
import { Rack } from '../../rack/entities/rack.entity';

@Table({
  tableName: 'servers',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'servers_rack_id_idx',
      using: 'btree',
      fields: ['rack_id'],
    },
    {
      name: 'servers_physical_placement_unique_idx',
      unique: true,
      fields: ['rack_id', 'rack_unit_position'],
    },
    {
      name: 'servers_cpu_model_id_idx',
      using: 'btree',
      fields: ['cpu_model_id'],
    },
    {
      name: 'servers_operating_system_id_idx',
      using: 'btree',
      fields: ['operating_system_id'],
    },
  ],
})
export class Server extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7'))
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    unique: true,
  })
  declare hostname: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'total_ram_mb',
  })
  declare totalRamMb: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'cpu_count',
  })
  declare cpuCount: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'rack_unit_position',
  })
  declare rackUnitPosition: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => OperatingSystem)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'operating_system_id',
  })
  declare operatingSystemId: string;

  @BelongsTo(() => OperatingSystem, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare operatingSystem: OperatingSystem;

  @ForeignKey(() => CpuModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'cpu_model_id',
  })
  declare cpuModelId: string;

  @BelongsTo(() => CpuModel, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare cpuModel: CpuModel;

  @ForeignKey(() => Rack)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'rack_id',
  })
  declare rackId: string;

  @BelongsTo(() => Rack, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare rack: Rack;
}
