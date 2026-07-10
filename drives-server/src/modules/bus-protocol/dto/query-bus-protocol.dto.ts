import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryBusProtocolDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'name',
    description:
      'Sortable fields: id, name, command_set, supports_hot_plug, managed, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'name',
    'command_set',
    'supports_hot_plug',
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'name',
    description:
      'Filterable fields: id, name, command_set, supports_hot_plug, managed',
  })
  @IsOptional()
  @IsIn([
    'id',
    'name',
    'command_set',
    'supports_hot_plug',
    'managed',
    'createdAt',
    'updatedAt',
  ])
  declare filterField?: string;
}
