import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryCpuModelDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, vendorId, architecture, name, physicalCores, threads, tdpWatts, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support rapid numeric sequence sorting in the UI
    'vendorId',
    'architecture',
    'name',
    'physicalCores',
    'threads',
    'tdpWatts',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
