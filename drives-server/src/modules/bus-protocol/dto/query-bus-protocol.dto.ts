import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryBusProtocolDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, name, commandSet, supportsHotPlug, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support rapid numeric sequence sorting in the UI
    'name',
    'commandSet', // Aligned to application camelCase convention
    'supportsHotPlug', // Aligned to application camelCase convention
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
