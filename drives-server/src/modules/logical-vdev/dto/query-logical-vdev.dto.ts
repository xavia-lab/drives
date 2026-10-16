import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryLogicalVdevDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, storagePoolId, vdevName, vdevRedundancyProfile, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow high-performance sequential numeric sorting in the UI
    'storagePoolId',
    'vdevName',
    'vdevRedundancyProfile',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable fields: id, displayKey, storagePoolId, vdevName, vdevRedundancyProfile',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow strict numerical equality filtering from UI inputs
    'storagePoolId',
    'vdevName',
    'vdevRedundancyProfile',
  ])
  declare filterField?: string;
}
