import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryStorageTypeDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, name, wearTrackable, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'wearTrackable', 'managed', 'createdAt', 'updatedAt'])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'name',
    description: 'Filterable fields: id, name, wearTrackable, managed',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'wearTrackable', 'managed', 'createdAt', 'updatedAt'])
  declare filterField?: string;
}
