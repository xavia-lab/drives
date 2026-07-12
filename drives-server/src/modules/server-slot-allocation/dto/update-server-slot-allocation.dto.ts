import { PartialType } from '@nestjs/swagger';
import { CreateServerSlotAllocationDto } from './create-server-slot-allocation.dto';

export class UpdateServerSlotAllocationDto extends PartialType(
  CreateServerSlotAllocationDto,
) {}
