import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryCapacityDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, name, value, unit, absoluteCapacity, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow high-performance sequential numeric sorting in the UI
    'name',
    'value',
    'unit',
    'absoluteCapacity', // 🌟 Denormalised byte count allows sorting names/labels by real size
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
