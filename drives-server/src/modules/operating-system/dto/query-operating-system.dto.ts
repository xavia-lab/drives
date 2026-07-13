import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryOperatingSystemDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description: 'Sortable fields: id, name, vendor, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'vendor', 'createdAt', 'updatedAt'])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'id',
    description: 'Sortable fields: id, name, vendor, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'vendor'])
  declare filterField?: string;
}
