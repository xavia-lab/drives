import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryVirtualServerDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, hostServerId, vmid, hostname, type, operatingSystemId, allocatedVcpus, allocatedMemoryValue, allocatedMemoryUnit, absoluteAllocatedMemory, isActive, notes, createdAt, updatedAt',
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
    'allocatedMemoryValue',
    'allocatedMemoryUnit',
    'absoluteAllocatedMemory', // 🌟 Denormalised byte count allows sorting by real memory size
    'isActive',
    'notes',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
