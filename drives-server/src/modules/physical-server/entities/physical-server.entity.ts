import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BeforeSave,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalCpu } from '../../physical-cpu/entities/physical-cpu.entity';
import { OperatingSystem } from '../../operating-system/entities/operating-system.entity';
import { Rack } from '../../rack/entities/rack.entity';
import { ServerSlot } from './server-slot.entity';
import { toBytes } from '../../../lib/utils/human.readable.bytes.converter';

export type MemoryUnit = 'MiB' | 'GiB' | 'TiB';

@Table({
  tableName: 'physical_servers',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'physical_servers_rack_id_idx',
      using: 'btree',
      fields: ['rack_id'],
    },
    {
      name: 'physical_servers_placement_unique_idx',
      unique: true,
      fields: ['rack_id', 'rack_unit_position'],
    },
    {
      name: 'physical_servers_operating_system_id_idx',
      using: 'btree',
      fields: ['operating_system_id'],
    },
  ],
})
export class PhysicalServer extends BaseModel {
  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    unique: true,
  })
  declare hostname: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    field: 'memory_value',
  })
  declare memoryValue: number;

  @Column({
    type: DataType.ENUM('MiB', 'GiB', 'TiB'),
    allowNull: false,
    defaultValue: 'GiB',
    field: 'memory_unit',
  })
  declare memoryUnit: MemoryUnit;

  // Stored (denormalised) byte count so it can be sorted/filtered server-side.
  // Computed from memoryValue + memoryUnit on every save via the @BeforeSave hook
  // below. Bytes are whole numbers, so BIGINT is exact and index-friendly; the
  // getter coerces back to a number because `pg` returns bigint columns as strings.
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: 0,
    field: 'absolute_memory',
    get() {
      const raw = this.getDataValue('absoluteMemory') as
        string | number | null | undefined;
      return raw === null || raw === undefined ? 0 : Number(raw);
    },
  })
  declare absoluteMemory: number;

  @BeforeSave
  static computeAbsoluteMemory(instance: PhysicalServer) {
    instance.absoluteMemory = Math.round(
      toBytes(Number(instance.memoryValue), instance.memoryUnit),
    );
  }

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'rack_unit_position',
  })
  declare rackUnitPosition: number;

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

  // --- Owned Children ---

  // Physical CPU chips installed in this server's sockets. The foreign key
  // (`physical_cpus.physical_server_id`) lives on the child, mirroring the
  // `ServerSlot` ownership model.
  @HasMany(() => PhysicalCpu, { foreignKey: 'physicalServerId' })
  declare cpus: PhysicalCpu[];

  @HasMany(() => ServerSlot)
  declare slots: ServerSlot[];
}
