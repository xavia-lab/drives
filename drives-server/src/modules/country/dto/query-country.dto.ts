import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryCountryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, name, code, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'code', 'managed', 'createdAt', 'updatedAt'])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'name',
    description: 'Filterable fields: id, name, code, managed',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'code', 'managed'])
  declare filterField?: string;
}
