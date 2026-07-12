import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryDatacenterDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'code',
    description:
      'Sortable fields: id, code, name, city, countryId, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn(['id', 'code', 'name', 'city', 'countryId', 'createdAt', 'updatedAt'])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'city',
    description: 'Filterable fields: id, code, name, city, countryId',
  })
  @IsOptional()
  @IsIn(['id', 'code', 'name', 'city', 'countryId'])
  declare filterField?: string;
}
