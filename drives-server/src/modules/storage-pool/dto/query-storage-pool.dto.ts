import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryStoragePoolDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'poolName',
    description:
      'Sortable fields: id, poolName, poolType, encryptionEnabled, serverId, virtualServerId, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'poolName',
    'poolType',
    'encryptionEnabled',
    'serverId',
    'virtualServerId',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'serverId',
    description:
      'Filterable fields: id, poolName, poolType, encryptionEnabled, serverId, virtualServerId',
  })
  @IsOptional()
  @IsIn([
    'id',
    'poolName',
    'poolType',
    'encryptionEnabled',
    'serverId',
    'virtualServerId',
  ])
  declare filterField?: string;
}
