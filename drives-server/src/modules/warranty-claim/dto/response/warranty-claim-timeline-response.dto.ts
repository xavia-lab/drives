import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarrantyClaimStatus } from '../../entities/warranty-claim.entity';
import { WarrantyClaimEventResponseDto } from './warranty-claim-event-response.dto';

// Full tracking timeline for a single warranty claim: the derived current
// status plus every appended event in ascending chronological order.
export class WarrantyClaimTimelineResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The warranty claim this timeline belongs to',
  })
  warrantyClaimId: string;

  @Expose()
  @ApiProperty({
    enum: WarrantyClaimStatus,
    example: WarrantyClaimStatus.SUBMITTED,
  })
  currentStatus: WarrantyClaimStatus;

  @Expose()
  @Type(() => WarrantyClaimEventResponseDto)
  @ApiPropertyOptional({
    type: () => WarrantyClaimEventResponseDto,
    nullable: true,
    description:
      'The latest state-changing event (null when the claim has no history)',
  })
  currentEvent: WarrantyClaimEventResponseDto | null;

  @Expose()
  @Type(() => WarrantyClaimEventResponseDto)
  @ApiProperty({
    type: () => WarrantyClaimEventResponseDto,
    isArray: true,
  })
  events: WarrantyClaimEventResponseDto[];
}
