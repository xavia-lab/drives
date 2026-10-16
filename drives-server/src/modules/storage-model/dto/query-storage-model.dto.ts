import { IsOptional, IsIn, IsString, Length, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryStorageModelDto extends PaginationQueryDto {
  // --- Strict Whitelist Field Overrides ---

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable catalog fields: id, displayKey, name, modelNumber, manufacturerId, storageTypeId, formFactorId, interfaceId, capacityId, maxEnduranceTbw, createdAt, updatedAt',
    default: 'id',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow fast sequential numeric sorting in the catalog UI
    'name',
    'modelNumber',
    'manufacturerId',
    'storageTypeId',
    'formFactorId',
    'interfaceId',
    'capacityId',
    'maxEnduranceTbw',
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
    example: 'displayKey',
    description:
      'Filterable columns for advanced expressions: id, displayKey, name, modelNumber, manufacturerId, storageTypeId, formFactorId, interfaceId, capacityId',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow clean numerical equality lookups from grid search filters
    'name',
    'modelNumber',
    'manufacturerId',
    'storageTypeId',
    'formFactorId',
    'interfaceId',
    'capacityId',
  ])
  declare filterField?: string;

  // --- Dedicated Top-Level Fast Lookup Filters ---

  @ApiPropertyOptional({
    description: 'Filter explicitly by a specific manufacturer vendor ID',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  manufacturerId?: string;

  @ApiPropertyOptional({
    description: 'Filter explicitly by a specific storage type lookup ID',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  storageTypeId?: string;

  @ApiPropertyOptional({
    description:
      'Filter explicitly by a specific physical form factor lookup ID',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  formFactorId?: string;

  @ApiPropertyOptional({
    description: 'Filter explicitly by a specific link protocol interface ID',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  interfaceId?: string;

  @ApiPropertyOptional({
    description:
      'Filter explicitly by a specific hardware byte capacity record ID',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  capacityId?: string;

  @ApiPropertyOptional({
    example: 'PM17',
    description:
      'Performs a global fuzzy case-insensitive wildcard text lookup (ILIKE %search%) across the name column',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  search?: string;
}
