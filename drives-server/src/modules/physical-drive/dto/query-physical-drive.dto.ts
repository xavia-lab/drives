import {
  IsOptional,
  IsIn,
  IsString,
  Length,
  IsInt,
  Min,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryPhysicalDriveDto extends PaginationQueryDto {
  // --- Strict Whitelist Field Overrides ---

  @ApiPropertyOptional({
    example: 'serialNumber',
    description:
      'Sortable inventory fields: id, label, serialNumber, worldwideNameWwn, acquisitionCost, purchaseDate, warrantyExpiryDate, storageModelId, retailerVendorId, currencyId, createdAt, updatedAt',
    default: 'id',
  })
  @IsOptional()
  @IsIn([
    'id',
    'label',
    'serialNumber',
    'worldwideNameWwn',
    'acquisitionCost',
    'purchaseDate',
    'warrantyExpiryDate',
    'storageModelId',
    'retailerVendorId',
    'currencyId',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'asc',
    enum: ['asc', 'desc'],
    description:
      'The global ordering direction parameter for sorting your queries',
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  declare sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    example: 'serialNumber',
    description:
      'Filterable columns for advanced expressions: id, label, serialNumber, worldwideNameWwn, storageModelId, retailerVendorId, currencyId',
  })
  @IsOptional()
  @IsIn([
    'id',
    'label',
    'serialNumber',
    'worldwideNameWwn',
    'storageModelId',
    'retailerVendorId',
    'currencyId',
  ])
  declare filterField?: string;

  // --- Dedicated Top-Level Fast Lookup Filters ---

  @ApiPropertyOptional({
    description:
      'Filter assets explicitly by a specific storage model catalog template ID',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  storageModelId?: string;

  @ApiPropertyOptional({
    description:
      'Filter assets explicitly by a specific retail vendor source partner ID',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  retailerVendorId?: string;

  @ApiPropertyOptional({
    description:
      'Filter assets explicitly by a specific purchase currency lookup ID',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  currencyId?: string;

  // --- Advanced Procurement Date Window Filters ---

  @ApiPropertyOptional({
    description:
      'Filter assets purchased on or after this date (ISO YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  purchaseDateStart?: string;

  @ApiPropertyOptional({
    description:
      'Filter assets purchased on or before this date (ISO YYYY-MM-DD)',
    example: '2026-03-31',
  })
  @IsOptional()
  @IsDateString()
  purchaseDateEnd?: string;

  // --- Global Wildcard Matcher ---

  @ApiPropertyOptional({
    example: 'PHG2134',
    description:
      'Performs a global fuzzy wildcard text lookup (ILIKE %search%) across the serialNumber column',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  search?: string;
}
