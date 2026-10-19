import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsInt,
  IsNumber,
  IsEnum,
  IsArray,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhysicalServerSlotDto } from './physical-server-slot.dto';

export enum MemoryUnit {
  MiB = 'MiB',
  GiB = 'GiB',
  TiB = 'TiB',
}

export class CreatePhysicalServerDto {
  @ApiPropertyOptional({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description: 'Unique fully qualified server system hostname key',
    maxLength: 128,
    example: 'us-east-compute-42.infra',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  hostname: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Physical CPU chips (UUIDv7 ids) installed in this server. Replaces the full set of assigned CPUs on update.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('7', {
    each: true,
    message: 'Each cpuId must be a valid UUIDv7 string',
  })
  cpuIds?: string[];

  @ApiProperty({
    description:
      'The normalized structural operating system lookup registration reference ID link',
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
      'Volatile RAM capacity value expressed in the selected memory unit',
    example: 512,
    required: true,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Memory value must be a number with maximum 2 decimal places' },
  )
  @IsNotEmpty()
  @Min(0, { message: 'Memory value cannot be negative' })
  @Max(99999999.99, { message: 'Memory value cannot exceed 99999999.99' })
  memoryValue: number;

  @ApiProperty({
    enum: MemoryUnit,
    example: MemoryUnit.GiB,
    description:
      'Binary memory unit token (RAM is addressed in powers of two) used to scale the memory value into bytes',
    required: true,
  })
  @IsEnum(MemoryUnit, {
    message: `Memory unit must be one of the following values: ${Object.values(MemoryUnit).join(', ')}`,
  })
  @IsNotEmpty()
  memoryUnit: MemoryUnit;

  @ApiProperty({
    description:
      'Target server cabinet grouping tag alphanumeric structural cabinet layout ID reference link',
    example: '019f5431-1bf4-72fd-a9c0-5a396eb14ea1',
    required: true,
  })
  @IsUUID('7', { message: 'The rackId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  rackId: string;

  @ApiProperty({
    description:
      'The horizontal bottom unit indexing slider number allocation slot elevation value marker',
    example: 22,
    required: true,
  })
  @IsInt()
  @Min(1)
  rackUnitPosition: number;

  @ApiPropertyOptional({
    type: [PhysicalServerSlotDto],
    description:
      'Backplane storage slots owned by this server. Replaces the full set of slots on update.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhysicalServerSlotDto)
  slots?: PhysicalServerSlotDto[];
}
