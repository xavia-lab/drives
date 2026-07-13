import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarrantyClaimStatus } from '../entities/warranty-claim.entity';

export class CreateWarrantyClaimDto {
  @ApiPropertyOptional({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description: 'The primary physical drive ID associated with this claim',
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e31',
    required: true,
  })
  @IsUUID('7', { message: 'The physicalDriveId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  physicalDriveId: string;

  @ApiPropertyOptional({
    description:
      'The optional drive lifecycle event ID that triggered this warranty return',
    example: '019f4fa1-57db-77eb-a3b8-37f5605bb4ff',
    required: false,
  })
  @IsOptional()
  @IsUUID('7', {
    message: 'The triggeringEventId must be a valid UUIDv7 string',
  })
  triggeringEventId?: string;

  @ApiProperty({
    description:
      'The vendor ID responsible for handling this warranty submission',
    example: '019f4fa1-57db-77fa-8fc8-e792abc40f5a',
    required: true,
  })
  @IsUUID('7', {
    message: 'The handledByVendorId must be a valid UUIDv7 string',
  })
  @IsNotEmpty()
  handledByVendorId: string;

  @ApiPropertyOptional({
    description:
      'The manufacturer issued RMA tracking number identifier string',
    maxLength: 64,
    example: 'RMA-990PRO-12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  rmaTrackingNumber?: string;

  @ApiPropertyOptional({
    description: 'The processing lifecycle state status of the warranty claim',
    enum: WarrantyClaimStatus,
    example: WarrantyClaimStatus.SUBMITTED,
    default: WarrantyClaimStatus.SUBMITTED,
  })
  @IsOptional()
  @IsEnum(WarrantyClaimStatus, {
    message: 'The claimStatus must match valid enum parameters',
  })
  claimStatus?: WarrantyClaimStatus;

  @ApiPropertyOptional({
    description:
      'Optional descriptive engineer troubleshooting log notes or comments',
    example:
      'Drive returned due to excessive reallocated sectors matching S.M.A.R.T telemetry data failure markers.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'The explicit date stamp indicating when the warranty paperwork was dispatched to vendor',
    example: '2026-07-12T05:23:21.690Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  submittedAt?: Date;

  @ApiPropertyOptional({
    description:
      'The resolution timestamp matching the closure or replacement delivery confirmation window',
    example: '2026-07-19T14:32:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  resolvedAt?: Date;
}
