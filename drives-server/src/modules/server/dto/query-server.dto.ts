import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryServerDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, hostname, totalRamMb, cpuModelId, cpuCount, operatingSystemId, rackId, rackUnitPosition, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support fast sequence-based chassis sorting
    'hostname',
    'totalRamMb',
    'cpuModelId',
    'cpuCount',
    'operatingSystemId',
    'rackId',
    'rackUnitPosition',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable fields: id, displayKey, hostname, totalRamMb, cpuModelId, cpuCount, operatingSystemId, rackId, rackUnitPosition',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow high-performance numerical lookup filters in hardware grids
    'hostname',
    'totalRamMb',
    'cpuModelId',
    'cpuCount',
    'operatingSystemId',
    'rackId',
    'rackUnitPosition',
  ])
  declare filterField?: string;
}
