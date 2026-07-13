import { PartialType } from '@nestjs/swagger';
import { CreateServerSlotDto } from './create-server-slot.dto';

export class UpdateServerSlotDto extends PartialType(CreateServerSlotDto) {}
