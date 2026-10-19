import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryLogicalDiskDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, logicalVdevId, physicalDriveId, osDeviceNodePath, isSpareDrive, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow high-performance sequential numeric sorting in the UI
    'logicalVdevId',
    'physicalDriveId',
    'osDeviceNodePath',
    'isSpareDrive',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
