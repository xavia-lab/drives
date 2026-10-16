import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryCpuModelDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, vendor, name, physicalCores, threads, tdpWatts, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support rapid numeric sequence sorting in the UI
    'vendor',
    'name',
    'physicalCores',
    'threads',
    'tdpWatts',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable fields: id, displayKey, vendor, name, physicalCores, threads, tdpWatts',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow high-performance numerical lookup filters in hardware grids
    'vendor',
    'name',
    'physicalCores',
    'threads',
    'tdpWatts',
  ])
  declare filterField?: string;
}
