import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryInterfaceDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, name, linkGeneration, throughput, busProtocolId, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
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
    example: 'name',
    description:
      'Filterable fields: id, name,  linkGeneration, throughput, busProtocolId, managed',
  })
  @IsOptional()
  @IsIn([
    'id',
    'name',
    'linkGeneration',
    'throughput',
    'busProtocolId',
    'managed',
  ])
  declare filterField?: string;
}
