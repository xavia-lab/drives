import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryInterfaceDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, name, linkGeneration, throughput, busProtocolId, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow fast sequence-based sorting in UI grids
    'name',
    'linkGeneration',
    'throughput',
    'busProtocolId',
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable fields: id, displayKey, name, linkGeneration, throughput, busProtocolId, managed',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support direct numerical lookups from your UI grid filters
    'name',
    'linkGeneration',
    'throughput',
    'busProtocolId',
    'managed',
  ])
  declare filterField?: string;
}
