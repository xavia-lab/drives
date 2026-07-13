import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryServerDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'hostname',
    description:
      'Sortable fields: id, hostname, totalRamMb, cpuModelId, cpuCount, operatingSystemId, rackId, rackUnitPosition, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
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
    example: 'rackId',
    description:
      'Filterable fields: id, hostname, totalRamMb, cpuModelId, cpuCount, operatingSystemId, rackId, rackUnitPosition',
  })
  @IsOptional()
  @IsIn([
    'id',
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
