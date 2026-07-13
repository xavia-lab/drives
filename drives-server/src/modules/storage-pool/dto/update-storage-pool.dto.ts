import { PartialType } from '@nestjs/swagger';
import { CreateStoragePoolDto } from './create-storage-pool.dto';

export class UpdateStoragePoolDto extends PartialType(CreateStoragePoolDto) {}
