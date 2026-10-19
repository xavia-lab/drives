import { IsOptional, IsIn, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { WarrantyClaimEventType } from '../entities/warranty-claim-event.entity';

export class QueryWarrantyClaimEventDto extends PaginationQueryDto {
  // --- Strict Whitelist Field Overrides ---

  @ApiPropertyOptional({
    example: 'eventTimestamp',
    description:
      'Sortable log fields: id, displayKey, warrantyClaimId, eventType, eventTimestamp, performedByUserId, replacementPhysicalDriveId, createdAt, updatedAt',
    default: 'eventTimestamp',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey',
    'warrantyClaimId',
    'eventType',
    'eventTimestamp',
    'performedByUserId',
    'replacementPhysicalDriveId',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'The global ordering direction parameter for sorting queries',
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  declare sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    example: 'eventType',
    description:
      'Filterable columns: id, displayKey, warrantyClaimId, eventType, eventTimestamp, performedByUserId, replacementPhysicalDriveId, createdAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey',
    'warrantyClaimId',
    'eventType',
    'eventTimestamp',
    'performedByUserId',
    'replacementPhysicalDriveId',
    'createdAt',
  ])
  declare filterField?: string;

  // --- Dedicated Top-Level Fast Lookup Filters ---

  @ApiPropertyOptional({
    description:
      'Filter logs explicitly by a specific warranty claim UUIDv7 id',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The warrantyClaimId must be a valid UUIDv7 string' })
  warrantyClaimId?: string;

  @ApiPropertyOptional({
    description: 'Filter logs explicitly by a specific tracking action type',
    enum: WarrantyClaimEventType,
    example: WarrantyClaimEventType.APPROVED,
  })
  @IsOptional()
  @IsIn(Object.values(WarrantyClaimEventType))
  eventType?: WarrantyClaimEventType;

  @ApiPropertyOptional({
    description: 'Filter logs by the operator user id that recorded them',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'performedByUserId must be a valid UUID' })
  performedByUserId?: string;

  @ApiPropertyOptional({
    description: 'Filter logs by the linked replacement drive id',
  })
  @IsOptional()
  @IsUUID('7', {
    message: 'The replacementPhysicalDriveId must be a valid UUIDv7 string',
  })
  replacementPhysicalDriveId?: string;

  // --- Event Timestamp Window ---

  @ApiPropertyOptional({
    description: 'Only include events at or after this ISO-8601 timestamp',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  eventTimestampFrom?: string;

  @ApiPropertyOptional({
    description: 'Only include events at or before this ISO-8601 timestamp',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  eventTimestampTo?: string;
}
