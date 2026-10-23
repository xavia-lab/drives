import { OmitType } from '@nestjs/swagger';
import { CreateLogicalVdevDto } from './create-logical-vdev.dto';

export class CreatePoolVdevDto extends OmitType(CreateLogicalVdevDto, [
  'storagePoolId',
] as const) {}
