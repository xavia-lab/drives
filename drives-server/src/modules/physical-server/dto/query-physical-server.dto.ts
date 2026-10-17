import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryPhysicalServerDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, hostname, memoryValue, memoryUnit, absoluteMemory, cpuModelId, cpuCount, operatingSystemId, rackId, rackUnitPosition, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support fast sequence-based chassis sorting
    'hostname',
    'memoryValue',
    'memoryUnit',
    'absoluteMemory', // 🌟 Denormalised byte count allows sorting by real memory size
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
      'Filterable fields: id, displayKey, hostname, memoryValue, memoryUnit, cpuModelId, cpuCount, operatingSystemId, rackId, rackUnitPosition',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow high-performance numerical lookup filters in hardware grids
    'hostname',
    'memoryValue',
    'memoryUnit',
    'cpuModelId',
    'cpuCount',
    'operatingSystemId',
    'rackId',
    'rackUnitPosition',
  ])
  declare filterField?: string;
}
