import { PartialType } from '@nestjs/swagger';
import { CreateWarrantyClaimDto } from './create-warranty-claim.dto';

export class UpdateWarrantyClaimDto extends PartialType(
  CreateWarrantyClaimDto,
) {}
