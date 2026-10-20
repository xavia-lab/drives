import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateWarrantyClaimDto } from './create-warranty-claim.dto';

/**
 * Create Warranty Claim workflow payload. The drive's triggering lifecycle
 * event is derived server-side (`RMA_INITIATE`, with a preceding
 * `DEPROVISION` when the drive is still IN_SERVICE).
 */
export class CreateWarrantyClaimWorkflowDto extends CreateWarrantyClaimDto {
  @ApiProperty({
    description:
      'The datacenter the unseated drive is currently located in. Scopes the drive and validates its location.',
    example: '019f6a00-0000-7a01-8a01-000000000001',
  })
  @IsUUID('7', { message: 'The datacenterId must be a valid UUIDv7 string' })
  datacenterId: string;
}
