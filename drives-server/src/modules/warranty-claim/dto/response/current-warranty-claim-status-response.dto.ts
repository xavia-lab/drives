import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarrantyClaimStatus } from '../../entities/warranty-claim.entity';
import { WarrantyClaimEventType } from '../../entities/warranty-claim-event.entity';

// Derived warranty claim snapshot: the status plus the latest state-changing
// event that produced it (null when the claim has no tracking events yet).
export class CurrentWarrantyClaimStatusDto {
  @Expose()
  @ApiProperty({
    enum: WarrantyClaimStatus,
    example: WarrantyClaimStatus.SUBMITTED,
  })
  status: WarrantyClaimStatus;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  eventId: string | null;

  @Expose()
  @ApiPropertyOptional({ enum: WarrantyClaimEventType, nullable: true })
  eventType: WarrantyClaimEventType | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  eventTimestamp: Date | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  performedByUserId: string | null;
}
