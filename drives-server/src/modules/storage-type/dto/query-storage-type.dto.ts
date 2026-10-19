import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryStorageTypeDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, name, wearTrackable, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow numeric chronological sorting in UI grids
    'name',
    'wearTrackable',
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
