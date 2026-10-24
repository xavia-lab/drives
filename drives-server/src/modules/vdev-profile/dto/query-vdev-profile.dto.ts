import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryVdevProfileDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'sortOrder',
    description:
      'Sortable fields: id, displayKey, code, displayName, technology, capacityMode, minMembers, maxMembers, sortOrder, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey',
    'code',
    'displayName',
    'technology',
    'capacityMode',
    'minMembers',
    'maxMembers',
    'sortOrder',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
