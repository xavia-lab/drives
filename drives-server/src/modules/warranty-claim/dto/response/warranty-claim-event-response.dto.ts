import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarrantyClaimEventType } from '../../entities/warranty-claim-event.entity';

// Shallow relationship serialization context for the received replacement drive.
class ReplacementDriveShallowDto {
  @Expose()
  @ApiProperty({ example: '019f4fa1-57db-77ba-9bd0-9620bc414e31' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'MFG-MODEL-20260101-001' })
  label: string;

  @Expose()
  @ApiProperty({ example: 'S3X0NX0A123456' })
  serialNumber: string;
}

export class WarrantyClaimEventResponseDto {
  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique UUIDv7 identifier of the event record',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 42,
    description: 'The consistent global sequential index number',
  })
  displayKey: number;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The parent warranty claim this event belongs to',
  })
  warrantyClaimId: string;

  @Expose()
  @ApiProperty({
    enum: WarrantyClaimEventType,
    example: WarrantyClaimEventType.SHIPPED_TO_VENDOR,
    description: 'The distinct tracking action type',
  })
  eventType: WarrantyClaimEventType;

  @Expose()
  @ApiProperty({
    example: '2026-07-12T05:23:21.690Z',
    description: 'The moment the tracking event occurred',
  })
  eventTimestamp: Date;

  @Expose()
  @ApiPropertyOptional({
    example: 'Dispatched via UPS, tracking 1Z999AA10123456784.',
    description: 'Descriptive notes captured with the event',
  })
  notes: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The database user id of the operator who recorded the event',
    nullable: true,
  })
  performedByUserId: string | null;

  @Expose()
  @ApiPropertyOptional({
    description:
      'The successor drive received for a REPLACEMENT_RECEIVED event (null otherwise)',
    nullable: true,
  })
  replacementPhysicalDriveId: string | null;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  updatedAt: Date;

  @Expose()
  @Type(() => ReplacementDriveShallowDto)
  @ApiPropertyOptional({
    type: ReplacementDriveShallowDto,
    description:
      'The received replacement drive (REPLACEMENT_RECEIVED events only)',
  })
  replacementDrive?: ReplacementDriveShallowDto | null;

  constructor(partial: Partial<WarrantyClaimEventResponseDto>) {
    Object.assign(this, partial);
  }
}
