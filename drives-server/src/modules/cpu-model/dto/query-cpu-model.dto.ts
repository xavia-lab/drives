import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryCpuModelDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, vendor, name, physicalCores, threads, tdpWatts, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
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
    example: 'vendor',
    description:
      'Filterable fields: id, vendor, name, physicalCores, threads, tdpWatts',
  })
  @IsOptional()
  @IsIn(['id', 'vendor', 'name', 'physicalCores', 'threads', 'tdpWatts'])
  declare filterField?: string;
}
