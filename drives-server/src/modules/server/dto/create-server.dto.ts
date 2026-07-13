import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServerDto {
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

  @ApiProperty({
    description:
      'Target processing model configuration UUIDv7 lookup identifier linking',
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    required: true,
  })
  @IsUUID('7', { message: 'The cpuModelId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  cpuModelId: string;

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
      'Volatile RAM capacities mapped inside the frame measured in Megabytes',
    example: 524288,
    required: true,
  })
  @IsInt()
  @Min(1)
  totalRamMb: number;

  @ApiPropertyOptional({
    description:
      'Total count of populated physical CPU socket layouts mounted on the hardware',
    example: 2,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  cpuCount?: number;

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
}
