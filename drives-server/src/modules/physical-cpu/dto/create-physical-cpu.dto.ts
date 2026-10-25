import {
  IsString,
  IsNotEmpty,
  Length,
  Min,
  IsNumber,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePhysicalCpuDto {
  @ApiPropertyOptional({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  id?: string;

  @ApiPropertyOptional({
    description:
      'Optional unique alphanumeric serial number printed on the CPU heat-spreader (IHS) or packaging label',
    example: 'BF2104S00012',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  serialNumber?: string;

  @ApiProperty({
    description:
      'The absolute localized unit procurement cost paid to acquire the physical CPU asset',
    example: 849.5,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 }) // Protects DECIMAL(12,2) bounds before database commit phases
  @Min(0)
  acquisitionCost: number;

  @ApiProperty({
    description:
      'The raw calendar date representing exactly when the component was bought in an YYYY-MM-DD standard syntax',
    example: '2026-07-09',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString() // Validates ISO-8601 calendar strings correctly
  purchaseDate: string;

  @ApiProperty({
    description:
      'The target legal contract date boundary indicating when supplier backup protection scopes drop off',
    example: '2031-07-09',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  warrantyExpiryDate: string;

  @ApiProperty({
    description:
      'The primary index lookup key identifying the manufacturer CPU engineering template record',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  cpuModelId: string;

  @ApiProperty({
    description:
      'The primary index lookup key pointing to the retail point-of-sale source vendor partner profile',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  retailerVendorId: string;

  @ApiProperty({
    description:
      'The primary index lookup key mapping the baseline denomination structure matching the acquisition price',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  currencyId: string;
}
