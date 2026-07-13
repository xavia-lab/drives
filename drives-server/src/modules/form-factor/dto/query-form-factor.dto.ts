import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryFormFactorDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, name, slotPitch, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'slotPitch', 'managed', 'createdAt', 'updatedAt'])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'name',
    description: 'Filterable fields: id, name, slotPitch, managed',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'slotPitch', 'managed', 'createdAt', 'updatedAt'])
  declare filterField?: string;
}
