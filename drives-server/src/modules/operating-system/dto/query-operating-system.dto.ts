import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryOperatingSystemDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, name, codeName, vendor, family, majorVersion, minorVersion, eolDate, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // Enables fast sequence-based sorting in UI grids
    'name',
    'codeName',
    'vendor',
    'family',
    'majorVersion',
    'minorVersion',
    'eolDate',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable fields: id, displayKey, name, codeName, vendor, family, majorVersion, minorVersion, eolDate',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // Supports direct numerical lookups from UI grid filters
    'name',
    'codeName',
    'vendor',
    'family',
    'majorVersion',
    'minorVersion',
    'eolDate',
  ])
  declare filterField?: string;
}
