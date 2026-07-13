import { PartialType } from '@nestjs/swagger';
import { CreateVirtualServerDto } from './create-virtual-server.dto';

export class UpdateVirtualServerDto extends PartialType(
  CreateVirtualServerDto,
) {}
