import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryVirtualServerDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, hostServerId, vmid, hostname, type, operatingSystemId, allocatedVcpus, allocatedRamMb, isActive, notes, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support rapid numeric sequence sorting
    'hostServerId',
    'vmid',
    'hostname',
    'type',
    'operatingSystemId',
    'allocatedVcpus',
    'allocatedRamMb',
    'isActive',
    'notes',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: '105',
    description:
      'Filterable fields: id, displayKey, hostServerId, vmid, hostname, type, operatingSystemId, allocatedVcpus, allocatedRamMb, isActive',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support direct integer numerical filtering matches
    'hostServerId',
    'vmid',
    'hostname',
    'type',
    'operatingSystemId',
    'allocatedVcpus',
    'allocatedRamMb',
    'isActive',
  ])
  declare filterField?: string;
}
