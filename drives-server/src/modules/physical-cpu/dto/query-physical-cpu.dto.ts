import {
  IsOptional,
  IsIn,
  IsString,
  Length,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryPhysicalCpuDto extends PaginationQueryDto {
  // --- Strict Whitelist Field Overrides ---

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable inventory fields: id, displayKey, label, serialNumber, acquisitionCost, purchaseDate, warrantyExpiryDate, cpuModelId, retailerVendorId, currencyId, createdAt, updatedAt',
    default: 'id',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey',
    'label',
    'serialNumber',
    'acquisitionCost',
    'purchaseDate',
    'warrantyExpiryDate',
    'cpuModelId',
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

  // --- Dedicated Top-Level Fast Lookup Filters ---

  @ApiPropertyOptional({
    description:
      'Filter assets explicitly by a specific CPU model catalog template ID',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  cpuModelId?: string;

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
    example: 'BF2104',
    description:
      'Performs a global fuzzy wildcard text lookup (ILIKE %search%) across the serialNumber column',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  search?: string;
}
