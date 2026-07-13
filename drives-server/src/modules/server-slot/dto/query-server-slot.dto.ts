import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryServerSlotDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'slotLabel',
    description:
      'Sortable fields: id, serverId, slotLabel, supportedInterfaceId, pcieBusAddress, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'serverId',
    'slotLabel',
    'supportedInterfaceId',
    'pcieBusAddress',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'serverId',
    description:
      'Filterable fields: id, serverId, slotLabel, supportedInterfaceId, pcieBusAddress',
  })
  @IsOptional()
  @IsIn([
    'id',
    'serverId',
    'slotLabel',
    'supportedInterfaceId',
    'pcieBusAddress',
  ])
  declare filterField?: string;
}
