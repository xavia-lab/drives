import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryPhysicalServerDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, hostname, memoryValue, memoryUnit, absoluteMemory, operatingSystemId, rackId, rackUnitPosition, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support fast sequence-based chassis sorting
    'hostname',
    'memoryValue',
    'memoryUnit',
    'absoluteMemory', // 🌟 Denormalised byte count allows sorting by real memory size
    'operatingSystemId',
    'rackId',
    'rackUnitPosition',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
