import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsDateString,
  Length,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DriveLifecycleEventType } from '../entities/drive-lifecycle-event.entity';

export class CreateDriveLifecycleEventDto {
  @ApiPropertyOptional({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description: 'The lifecycle action to append to the drive history timeline',
    enum: DriveLifecycleEventType,
    example: DriveLifecycleEventType.PROVISION,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(DriveLifecycleEventType, {
    message: `eventType must be a valid value: ${Object.values(
      DriveLifecycleEventType,
    ).join(', ')}`,
  })
  eventType: DriveLifecycleEventType;

  @ApiPropertyOptional({
    description:
      'The automation daemon, service node or human operator label that recorded this entry. Defaults to the authenticated operator when omitted',
    example: 'system_agent_node_42',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 128)
  triggeredBy?: string;

  @ApiPropertyOptional({
    description:
      'The database user id of the operator who recorded the entry. The authenticated principal is used when omitted',
    example: '00000000-0000-0000-0000-000000000000',
    required: false,
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'performedByUserId must be a valid UUID' })
  performedByUserId?: string;

  @ApiPropertyOptional({
    description:
      'The successor physical drive that replaces this one. Required for RMA_REPLACE and rejected for any other event type',
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    required: false,
  })
  @IsOptional()
  @IsUUID('7', {
    message: 'The replacementPhysicalDriveId must be a valid UUIDv7 string',
  })
  replacementPhysicalDriveId?: string;

  @ApiPropertyOptional({
    description:
      'The moment the event occurred. Defaults to now and must not precede the latest existing lifecycle event',
    example: '2026-07-09T15:26:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  eventTimestamp?: string;

  @ApiPropertyOptional({
    description:
      'Flexible key-value payload for diagnostic metrics, failure codes, RMA details or free-form notes',
    example: {
      failure_code: 'SMART_REALLOCATED_SECTOR_COUNT',
      rma_tracking_number: 'RMA-990PRO-12345',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  contextMetadata?: Record<string, unknown>;
}
