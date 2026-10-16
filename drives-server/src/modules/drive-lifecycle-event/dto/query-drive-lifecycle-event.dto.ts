import { IsOptional, IsIn, IsString, Length, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DriveLifecycleEventType } from '../entities/drive-lifecycle-event.entity';

export class QueryDriveLifecycleEventDto extends PaginationQueryDto {
  // --- Strict Whitelist Field Overrides ---

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable log fields: id, displayKey, physicalDriveId, eventType, eventTimestamp, triggeredBy, createdAt, updatedAt',
    default: 'eventTimestamp',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow fast sequence-based sorting in event streams
    'physicalDriveId',
    'eventType',
    'eventTimestamp',
    'triggeredBy',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description:
      'The global ordering direction parameter for sorting your queries',
    default: 'desc', // Defaulting to descending provides the latest telemetry entries first
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  declare sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable columns for advanced expressions: id, displayKey, physicalDriveId, eventType, triggeredBy',
  })
  @IsOptional()
  @IsIn(['id', 'displayKey', 'physicalDriveId', 'eventType', 'triggeredBy']) // 🌟 Added displayKey for direct index lookups
  declare filterField?: string;

  // --- Dedicated Top-Level Fast Lookup Filters ---

  @ApiPropertyOptional({
    description:
      'Filter logs explicitly by a specific physical drive serial pointer ID',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  physicalDriveId?: string; // 🌟 Fixed: Changed from number to string to match IsUUID validation bounds

  @ApiPropertyOptional({
    description:
      'Filter logs explicitly by a specific milestone state transition step',
    enum: DriveLifecycleEventType,
    example: 'FAIL',
  })
  @IsOptional()
  @IsIn(Object.values(DriveLifecycleEventType))
  eventType?: DriveLifecycleEventType;

  @ApiPropertyOptional({
    description:
      'Filter logs explicitly by the system node agent name or operator credential string',
    example: 'system_agent_node_42',
  })
  @IsOptional()
  @IsString()
  @Length(1, 128)
  triggeredBy?: string;
}
