import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateStoragePoolDto } from './create-storage-pool.dto';

// Host changes are not edited here: attaching/detaching a pool goes through the
// IMPORT/EXPORT event endpoints so the action is recorded in the history log.
export class UpdateStoragePoolDto extends PartialType(
  OmitType(CreateStoragePoolDto, ['serverId', 'virtualServerId'] as const),
) {}
