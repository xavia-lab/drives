import { PartialType } from '@nestjs/swagger';
import { CreateLogicalDiskDto } from './create-logical-disk.dto';

export class UpdateLogicalDiskDto extends PartialType(CreateLogicalDiskDto) {}
