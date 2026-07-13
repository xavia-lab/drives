import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryLogicalVdevDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'vdevName',
    description:
      'Sortable fields: id, storagePoolId, vdevName, vdevRedundancyProfile, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'storagePoolId',
    'vdevName',
    'vdevRedundancyProfile',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'storagePoolId',
    description:
      'Filterable fields: id, storagePoolId, vdevName, vdevRedundancyProfile',
  })
  @IsOptional()
  @IsIn(['id', 'storagePoolId', 'vdevName', 'vdevRedundancyProfile'])
  declare filterField?: string;
}
