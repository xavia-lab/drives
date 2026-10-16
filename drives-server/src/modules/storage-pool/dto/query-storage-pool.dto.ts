import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryStoragePoolDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, poolName, poolType, encryptionEnabled, serverId, virtualServerId, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support rapid numeric sequence sorting in the UI
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
    example: 'displayKey',
    description:
      'Filterable fields: id, displayKey, poolName, poolType, encryptionEnabled, serverId, virtualServerId',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow strict numerical equality filtering from UI inputs
    'poolName',
    'poolType',
    'encryptionEnabled',
    'serverId',
    'virtualServerId',
  ])
  declare filterField?: string;
}
