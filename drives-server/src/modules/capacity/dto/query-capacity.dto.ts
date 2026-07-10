import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryCapacityDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, name, value, unit, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'value', 'unit', 'managed', 'createdAt', 'updatedAt'])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'name',
    description: 'Filterable fields: id, name, value, unit, managed',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'value', 'unit', 'managed'])
  declare filterField?: string;
}
