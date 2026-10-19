import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryDatacenterDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, code, name, city, countryId, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow high-performance sequential numeric sorting in the UI
    'code',
    'name',
    'city',
    'countryId',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
