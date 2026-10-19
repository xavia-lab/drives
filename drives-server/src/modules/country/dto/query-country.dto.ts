import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryCountryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, name, code, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support rapid numeric sequence sorting in the UI
    'name',
    'code',
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
