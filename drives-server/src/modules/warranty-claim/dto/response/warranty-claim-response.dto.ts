import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarrantyClaimStatus } from '../../entities/warranty-claim.entity';
import { WarrantyClaimEventType } from '../../entities/warranty-claim-event.entity';

// Shallow relationship serialization contexts
class PhysicalDriveShallowDto {
  @Expose()
  @ApiProperty({ example: '019f4fa1-57db-77ba-9bd0-9620bc414e31' })
  id: string;
  @Expose() @ApiProperty({ example: 'S3X0NX0A123456' }) serialNumber: string;
}

class DriveLifecycleEventShallowDto {
  @Expose()
  @ApiProperty({ example: '019f4fa1-57db-77eb-a3b8-37f5605bb4ff' })
  id: string;
  @Expose() @ApiProperty({ example: 'FAIL' }) eventType: string;
}

class VendorShallowDto {
  @Expose()
  @ApiProperty({ example: '019f4fa1-57db-77fa-8fc8-e792abc40f5a' })
  id: string;
  @Expose() @ApiProperty({ example: 'Samsung Electronics' }) name: string;
}

class CurrentEventShallowDto {
  @Expose()
  @ApiProperty({ example: '019f4fa1-57db-72d7-b037-2f35d54f2794' })
  id: string;
  @Expose()
  @ApiProperty({
    enum: WarrantyClaimEventType,
    example: WarrantyClaimEventType.APPROVED,
  })
  eventType: WarrantyClaimEventType;
  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  eventTimestamp: Date;
}

export class WarrantyClaimResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  displayKey: number;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique UUIDv7 primary identifier of this claim',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e31',
    description: 'The foreign key ID linking to the parent physical drive',
  })
  physicalDriveId: string;

  @Expose()
  @ApiPropertyOptional({
    example: '019f4fa1-57db-77eb-a3b8-37f5605bb4ff',
    description:
      'The optional foreign key ID linking to the triggering lifecycle event',
  })
  triggeringEventId: string | null;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-77fa-8fc8-e792abc40f5a',
    description: 'The foreign key ID linking to the managing vendor',
  })
  handledByVendorId: string;

  @Expose()
  @ApiPropertyOptional({
    example: 'RMA-990PRO-12345',
    description: 'The manufacturer-issued RMA tracking number',
  })
  rmaTrackingNumber: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: 'Drive failed due to bad block sector growth.',
    description: 'Descriptive troubleshooting logs or notes',
  })
  notes: string | null;

  // --- Derived fields (from the append-only warranty_claim_events log) ---

  @Expose()
  @ApiProperty({
    enum: WarrantyClaimStatus,
    example: WarrantyClaimStatus.SUBMITTED,
    description:
      'The derived lifecycle status of the claim (a claim with no events is SUBMITTED)',
  })
  currentStatus: WarrantyClaimStatus;

  @Expose()
  @ApiProperty({
    example: '2026-07-12T05:23:21.690Z',
    description: 'When the claim was opened (the claim record creation time)',
  })
  openedAt: Date;

  @Expose()
  @ApiPropertyOptional({
    example: '2026-07-19T14:32:00.000Z',
    description:
      'When the claim was resolved/closed, derived from the terminal tracking event',
    nullable: true,
  })
  resolvedAt: Date | null;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  updatedAt: Date;

  // --- Populated Relation Properties ---

  @Expose()
  @Type(() => PhysicalDriveShallowDto)
  @ApiProperty({ type: PhysicalDriveShallowDto })
  physicalDrive: PhysicalDriveShallowDto;

  @Expose()
  @Type(() => DriveLifecycleEventShallowDto)
  @ApiPropertyOptional({ type: DriveLifecycleEventShallowDto })
  triggeringEvent: DriveLifecycleEventShallowDto | null;

  @Expose()
  @Type(() => VendorShallowDto)
  @ApiProperty({ type: VendorShallowDto })
  handledByVendor: VendorShallowDto;

  @Expose()
  @Type(() => CurrentEventShallowDto)
  @ApiPropertyOptional({
    type: CurrentEventShallowDto,
    description:
      'The latest state-changing tracking event (null when none recorded yet)',
  })
  currentEvent?: CurrentEventShallowDto | null;
}
