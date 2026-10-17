import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { BaseModel } from '../../../shared/entities/base.model';
import { PhysicalServer } from '../../physical-server/entities/physical-server.entity';
import { OperatingSystem } from '../../operating-system/entities/operating-system.entity';

// Define a structural TypeScript enum matching your explicit database ENUM constraints
export enum VirtualServerType {
  VM = 'VM',
  CONTAINER = 'CONTAINER',
}

@Table({
  tableName: 'virtual_servers',
  timestamps: true,
  underscored: true, // Automatically maps camelCase to snake_case in the database
  // 🌟 Class-level database indexes mapped exactly from the normalized migration file
  indexes: [
    {
      name: 'virtual_servers_host_server_idx',
      using: 'btree',
      fields: ['host_server_id'],
    },
    {
      name: 'virtual_servers_vmid_unique_idx',
      unique: true,
      fields: ['host_server_id', 'vmid'],
      where: {
        vmid: { [Op.ne]: null },
      },
    },
    {
      name: 'virtual_servers_operating_system_id_idx',
      using: 'btree',
      fields: ['operating_system_id'],
    },
  ],
})
export class VirtualServer extends BaseModel {
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment:
      'The native Hypervisor cluster VMID cluster identifier (e.g., 100, 101)',
  })
  declare vmid: number | null;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    unique: true, // e.g., 'truenas-core.local'
  })
  declare hostname: string;

  @Column({
    type: DataType.ENUM(...Object.values(VirtualServerType)),
    defaultValue: VirtualServerType.VM,
    allowNull: false,
  })
  declare type: VirtualServerType;

  @Column({
    type: DataType.INTEGER,
    allowNull: false, // e.g., 4, 8
    field: 'allocated_vcpus',
  })
  declare allocatedVcpus: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false, // Stored in MB for precise integer computation
    field: 'allocated_ram_mb',
  })
  declare allocatedRamMb: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'is_active',
  })
  declare isActive: boolean;

  @Column(DataType.TEXT)
  declare notes: string | null;

  // --- Foreign Keys and Associations ---

  @ForeignKey(() => PhysicalServer)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'host_server_id',
  })
  declare hostServerId: string;

  @BelongsTo(() => PhysicalServer, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  declare hostServer: PhysicalServer;

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
}
