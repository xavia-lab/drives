import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VirtualServerType } from '../entities/virtual-server.entity';

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
      'Total volatile random access RAM volume memory constraints assigned measured in Megabytes',
    example: 8192,
    required: true,
  })
  @IsInt()
  @Min(1)
  allocatedRamMb: number;

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
}
