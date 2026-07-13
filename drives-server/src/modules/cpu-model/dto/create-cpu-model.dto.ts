import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CpuVendor } from '../entities/cpu-model.entity';

export class CreateCpuModelDto {
  @ApiPropertyOptional({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description: 'The manufacturer vendor of the CPU',
    enum: CpuVendor,
    example: CpuVendor.AMD,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(CpuVendor, {
    message: 'The vendor must match allowed enum entries (AMD, INTEL, ARM)',
  })
  vendor: CpuVendor;

  @ApiProperty({
    description: 'The distinctive product name identifier',
    maxLength: 64,
    example: 'EPYC 7763',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  name: string;

  @ApiProperty({
    description: 'Count of physical processing cores built on the die layout',
    example: 64,
    required: true,
  })
  @IsInt()
  @Min(1)
  physicalCores: number;

  @ApiProperty({
    description: 'Total processing threads enabled across computing surfaces',
    example: 128,
    required: true,
  })
  @IsInt()
  @Min(1)
  threads: number;

  @ApiPropertyOptional({
    description: 'Thermal Design Power consumption metric rated in watts',
    example: 280,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  tdpWatts?: number;
}
