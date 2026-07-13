import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryVirtualServerDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'hostname',
    description:
      'Sortable fields: id, hostServerId, vmid, hostname, type, operatingSystemId, allocatedVcpus, allocatedRamMb, isActive, notes, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
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
    example: 'hostServerId',
    description:
      'Filterable fields: id, hostServerId, vmid, hostname, type, operatingSystemId, allocatedVcpus, allocatedRamMb, isActive',
  })
  @IsOptional()
  @IsIn([
    'id',
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
