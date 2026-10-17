import { PartialType } from '@nestjs/swagger';
import { CreatePhysicalServerDto } from './create-physical-server.dto';

export class UpdatePhysicalServerDto extends PartialType(
  CreatePhysicalServerDto,
) {}
