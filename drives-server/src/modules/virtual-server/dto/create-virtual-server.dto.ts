import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MemoryUnit,
  VirtualServerType,
} from '../entities/virtual-server.entity';
import { PassthroughSlotDto } from './passthrough-slot.dto';

export class CreateVirtualServerDto {
  @ApiPropertyOptional({
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description:
      'Relational link pointer reference ID connecting to the baremetal hypervisor hardware server framework node',
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    required: true,
  })
  @IsUUID('7', { message: 'The hostServerId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  hostServerId: string;

  @ApiPropertyOptional({
    description:
      'The clustering numerical identifier key assigned inside the virtualization hypervisor pane wrapper',
    example: 101,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  vmid?: number;

  @ApiProperty({
    description:
      'Unique fully qualified virtual machine hostname identity key string',
    maxLength: 128,
    example: 'truenas-core.local',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  hostname: string;

  @ApiPropertyOptional({
    description:
      'The physical virtualization deployment method structural format style',
    enum: VirtualServerType,
    example: VirtualServerType.VM,
    default: VirtualServerType.VM,
  })
  @IsOptional()
  @IsEnum(VirtualServerType, {
    message: 'The type must match supported options (VM, CONTAINER)',
  })
  type?: VirtualServerType;

  @ApiProperty({
    description:
      'Relational link pointer reference ID linking onto the target guest operating system schema layout',
    example: '019f5431-1bf4-73bc-9d1a-5b32e0bc2754',
    required: true,
  })
  @IsUUID('7', {
    message: 'The operatingSystemId must be a valid UUIDv7 string',
  })
  @IsNotEmpty()
  operatingSystemId: string;

  @ApiProperty({
    description:
      'Total allocation compute count variables of processor virtual sockets vCPUs assigned to the instance',
    example: 4,
    required: true,
  })
  @IsInt()
  @Min(1)
  allocatedVcpus: number;

  @ApiProperty({
    description:
      'Volatile RAM allocation value expressed in the selected memory unit',
    example: 8,
    required: true,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Memory value must be a number with maximum 2 decimal places' },
  )
  @IsNotEmpty()
  @Min(0, { message: 'Memory value cannot be negative' })
  @Max(99999999.99, { message: 'Memory value cannot exceed 99999999.99' })
  allocatedMemoryValue: number;

  @ApiProperty({
    description:
      'Binary memory unit token (RAM is addressed in powers of two) used to scale the allocated memory value into bytes',
    enum: MemoryUnit,
    example: MemoryUnit.GiB,
    required: true,
  })
  @IsEnum(MemoryUnit, {
    message: `Memory unit must be one of the following values: ${Object.values(MemoryUnit).join(', ')}`,
  })
  @IsNotEmpty()
  allocatedMemoryUnit: MemoryUnit;

  @ApiPropertyOptional({
    description:
      'Logical operations status flag asserting if the container system is currently running active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Technician description logs tracking capacity purpose configs details',
    example:
      'Main file storage node containing clustered block volume allocations.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [PassthroughSlotDto],
    description:
      'Backplane slots of the host physical server passed through to this guest. Replaces the full set of passthrough mappings on update.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassthroughSlotDto)
  passthroughSlots?: PassthroughSlotDto[];
}
