import { PartialType } from '@nestjs/swagger';
import { CreateLogicalVdevDto } from './create-logical-vdev.dto';

export class UpdateLogicalVdevDto extends PartialType(CreateLogicalVdevDto) {}
