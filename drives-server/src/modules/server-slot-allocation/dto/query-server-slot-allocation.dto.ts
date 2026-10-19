import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryServerSlotAllocationDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, actionType, serverSlotId, physicalDriveId, userId, timestamp, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support fast sequence-based sorting for audit trails
    'actionType',
    'serverSlotId',
    'physicalDriveId',
    'userId',
    'timestamp',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
