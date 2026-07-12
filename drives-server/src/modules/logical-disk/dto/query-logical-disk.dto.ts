import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryLogicalDiskDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'osDeviceNodePath',
    description:
      'Sortable fields: id, logicalVdevId, physicalDriveId, osDeviceNodePath, isSpareDrive, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'logicalVdevId',
    'physicalDriveId',
    'osDeviceNodePath',
    'isSpareDrive',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'logicalVdevId',
    description:
      'Filterable fields: id, logicalVdevId, physicalDriveId, osDeviceNodePath, isSpareDrive',
  })
  @IsOptional()
  @IsIn([
    'id',
    'logicalVdevId',
    'physicalDriveId',
    'osDeviceNodePath',
    'isSpareDrive',
  ])
  declare filterField?: string;
}
