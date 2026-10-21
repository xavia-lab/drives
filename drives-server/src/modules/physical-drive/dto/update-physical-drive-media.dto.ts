import { PartialType } from '@nestjs/swagger';
import { PhysicalDriveMediaUploadItemDto } from './physical-drive-media.dto';

export class UpdatePhysicalDriveMediaDto extends PartialType(
  PhysicalDriveMediaUploadItemDto,
) {}
