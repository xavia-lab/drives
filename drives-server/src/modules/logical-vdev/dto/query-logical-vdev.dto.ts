import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

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
}
