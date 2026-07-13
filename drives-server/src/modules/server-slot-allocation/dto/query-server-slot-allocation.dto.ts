import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryServerSlotAllocationDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'timestamp',
    description:
      'Sortable fields: id, actionType, serverSlotId, physicalDriveId, userId, timestamp, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'actionType',
    'serverSlotId',
    'physicalDriveId',
    'userId',
    'timestamp',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'serverSlotId',
    description:
      'Filterable fields: id, actionType, serverSlotId, physicalDriveId, userId, timestamp',
  })
  @IsOptional()
  @IsIn([
    'id',
    'actionType',
    'serverSlotId',
    'physicalDriveId',
    'userId',
    'timestamp',
  ])
  declare filterField?: string;
}
