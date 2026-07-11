import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, email, username, name, firstname, lastname, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'email',
    'username',
    'firstname',
    'lastname',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'name',
    description:
      'Filterable fields: id, name, purity, moniker, symbol, managed',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'purity', 'moniker', 'managed'])
  declare filterField?: string;
}
