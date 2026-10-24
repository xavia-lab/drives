import { PartialType } from '@nestjs/swagger';
import { CreateVdevProfileDto } from './create-vdev-profile.dto';

export class UpdateVdevProfileDto extends PartialType(CreateVdevProfileDto) {}
