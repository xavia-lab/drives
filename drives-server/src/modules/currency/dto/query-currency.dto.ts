import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryCurrencyDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, displayKey, name, code, symbol, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey',
    'name',
    'code',
    'symbol',
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
