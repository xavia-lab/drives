import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryFormFactorDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, name, slotPitch, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow high-performance sequential numeric sorting in the UI
    'name',
    'slotPitch',
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable fields: id, displayKey, name, slotPitch, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow strict numerical equality filtering from UI inputs
    'name',
    'slotPitch',
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare filterField?: string;
}
