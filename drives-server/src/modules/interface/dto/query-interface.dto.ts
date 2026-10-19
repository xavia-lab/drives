import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

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
}
