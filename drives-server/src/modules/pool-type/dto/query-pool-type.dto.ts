import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryPoolTypeDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, name, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn(['id', 'displayKey', 'name', 'managed', 'createdAt', 'updatedAt'])
  declare sortField?: string;
}
