import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarrantyClaimEventType } from '../entities/warranty-claim-event.entity';

export class CreateWarrantyClaimEventDto {
  @ApiPropertyOptional({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description: 'The tracking action to append to the claim history',
    enum: WarrantyClaimEventType,
    example: WarrantyClaimEventType.SHIPPED_TO_VENDOR,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(WarrantyClaimEventType, {
    message: `eventType must be a valid value: ${Object.values(
      WarrantyClaimEventType,
    ).join(', ')}`,
  })
  eventType: WarrantyClaimEventType;

  @ApiPropertyOptional({
    description:
      'The moment the event occurred. Defaults to now and must not precede the latest existing event',
    example: '2026-07-12T05:23:21.690Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  eventTimestamp?: string;

  @ApiPropertyOptional({
    description:
      'Optional descriptive notes for this tracking entry (vendor correspondence, rejection reasons, etc.)',
    example: 'Dispatched via UPS, tracking 1Z999AA10123456784.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

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
      'The successor physical drive received from the vendor. Required for REPLACEMENT_RECEIVED and rejected for any other event type',
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    required: false,
  })
  @IsOptional()
  @IsUUID('7', {
    message: 'The replacementPhysicalDriveId must be a valid UUIDv7 string',
  })
  replacementPhysicalDriveId?: string;
}
