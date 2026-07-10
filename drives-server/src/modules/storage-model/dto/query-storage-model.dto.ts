import {
  IsOptional,
  IsIn,
  IsString,
  Length,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryStorageModelDto extends PaginationQueryDto {
  // --- Strict Whitelist Field Overrides ---

  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable catalog fields: id, name, modelNumber, manufacturerId, storageTypeId, formFactorId, interfaceId, capacityId, maxEnduranceTbw, createdAt, updatedAt',
    default: 'id',
  })
  @IsOptional()
  @IsIn([
    'id',
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
    example: 'name',
    description:
      'Filterable columns for advanced expressions: id, name, manufacturerId, storageTypeId, formFactorId, interfaceId, capacityId',
  })
  @IsOptional()
  @IsIn([
    'id',
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
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  manufacturerId?: number;

  @ApiPropertyOptional({
    description: 'Filter explicitly by a specific storage type lookup ID',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storageTypeId?: number;

  @ApiPropertyOptional({
    description:
      'Filter explicitly by a specific physical form factor lookup ID',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  formFactorId?: number;

  @ApiPropertyOptional({
    description: 'Filter explicitly by a specific link protocol interface ID',
    example: 52,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  interfaceId?: number;

  @ApiPropertyOptional({
    description:
      'Filter explicitly by a specific hardware byte capacity record ID',
    example: 101,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacityId?: number;

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
