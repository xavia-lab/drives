import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryServerSlotDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, serverId, slotLabel, supportedInterfaceId, pcieBusAddress, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow fast, sequence-based sorting in infrastructure lists
    'serverId',
    'slotLabel',
    'supportedInterfaceId',
    'pcieBusAddress',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable fields: id, displayKey, serverId, slotLabel, supportedInterfaceId, pcieBusAddress',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support direct numerical lookups from your UI grid filters
    'serverId',
    'slotLabel',
    'supportedInterfaceId',
    'pcieBusAddress',
  ])
  declare filterField?: string;
}
