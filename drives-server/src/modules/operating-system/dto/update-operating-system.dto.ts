import { PartialType } from '@nestjs/swagger';
import { CreateOperatingSystemDto } from './create-operating-system.dto';

export class UpdateOperatingSystemDto extends PartialType(
  CreateOperatingSystemDto,
) {}
