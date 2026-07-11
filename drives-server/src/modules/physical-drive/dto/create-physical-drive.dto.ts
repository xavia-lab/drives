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

export class CreatePhysicalDriveDto {
  @ApiPropertyOptional({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  id?: string;

  @ApiProperty({
    description:
      'The unique alphanumeric serial number printed directly on the drive case chassis label',
    example: 'PHG2134001A87',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  serialNumber: string;

  @ApiProperty({
    description:
      'The global Worldwide Name unique 64-bit storage device registration identifier',
    example: 'eui.00253811110023c4',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  worldwideNameWwn?: string | null;

  @ApiProperty({
    description:
      'The absolute localized unit procurement cost paid to acquire the physical hardware asset slice',
    example: 849.5,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 }) // Protects DECIMAL(12,2) bounds before database commit phases
  @Min(0)
  acquisitionCost: number;

  @ApiProperty({
    description:
      'The raw calendar date representing exactly when the equipment was bought in an YYYY-MM-DD standard syntax',
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
      'The primary index lookup key identifying the manufacturer device engineering template record',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  storageModelId: string;

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
