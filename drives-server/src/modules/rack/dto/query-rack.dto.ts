import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryRackDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, name, datacenterId, totalRackUnits, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'name',
    'datacenterId',
    'totalRackUnits',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'datacenterId',
    description:
      'Sortable fields: id, name, datacenterId, totalRackUnits, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'datacenterId', 'totalRackUnits', 'totalRackUnits'])
  declare filterField?: string;
}
