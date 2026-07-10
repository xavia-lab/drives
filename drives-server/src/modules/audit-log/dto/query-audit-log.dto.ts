import { IsOptional, IsIn, IsString, Length, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryAuditLogDto extends PaginationQueryDto {
  // --- Strict Whitelist Field Overrides ---

  @ApiPropertyOptional({
    example: 'timestamp',
    description:
      'Sortable audit fields: id, action, resource, resourceId, timestamp, userId, createdAt, updatedAt',
    default: 'timestamp',
  })
  @IsOptional()
  @IsIn([
    'id',
    'action',
    'resource',
    'resourceId',
    'timestamp',
    'userId',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description:
      'The transactional directional matrix order for displaying operations history logs',
    default: 'desc', // Defaulting to descending provides the freshest security entries first
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  declare sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    example: 'resource',
    description:
      'Filterable columns for advanced expressions: id, action, resource, resourceId, userId',
  })
  @IsOptional()
  @IsIn(['id', 'action', 'resource', 'resourceId', 'userId'])
  declare filterField?: string;

  // --- Dedicated Top-Level Fast Lookup Filters for Refine Workspace Views ---

  @ApiPropertyOptional({
    description:
      'Isolate history logs down to a specific target domain entity table name',
    example: 'physical_drives',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  resource?: string;

  @ApiPropertyOptional({
    description:
      'Isolate history logs down to a specific individual record string key matching a single workspace page target',
    example: '12',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  resourceId?: string;

  @ApiPropertyOptional({
    description:
      'Isolate logging metrics down to a specific operations method keyword matching standard frontend filters',
    example: 'delete',
  })
  @IsOptional()
  @IsIn(['create', 'update', 'delete'])
  action?: string;

  @ApiPropertyOptional({
    description:
      'Isolate metrics down to a specific Keycloak operator account UUID boundary token footprint',
    example: 'c3b073b4-d112-4217-9154-159d3df398ee',
  })
  @IsOptional()
  @IsUUID('4') // Enforces strict RFC UUID checking matching your identity platform
  userId?: string;
}
