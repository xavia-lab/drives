import { Expose, Transform, Type } from 'class-transformer';
import { VdevClass } from '../../entities/logical-vdev.entity';
import { VdevProfileResponseDto } from '../../../vdev-profile/dto/response/vdev-profile-response.dto';
import type { VdevCapacity } from '../../vdev-capacity.service';

class StoragePoolShallowDto {
  @Expose() id: string;
  @Expose() poolName: string;
}

class VdevMemberShallowDto {
  @Expose() id: string;
  @Expose() physicalDriveId: string;
  @Expose() osDeviceNodePath: string | null;
  @Expose() memberRole: string;
  @Expose() attachedAt: Date;
  @Expose() physicalDrive?: {
    id: string;
    label: string;
    serialNumber: string;
  };
}

export class LogicalVdevResponseDto {
  @Expose() displayKey: number;
  @Expose() id: string;
  @Expose() storagePoolId: string;
  @Expose() redundancyProfileId: string;
  @Expose() vdevName: string;
  @Expose() vdevClass: VdevClass;
  @Expose() sortOrder: number;
  @Expose() notes: string | null;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;

  @Expose()
  @Type(() => StoragePoolShallowDto)
  storagePool?: StoragePoolShallowDto;

  @Expose()
  @Type(() => VdevProfileResponseDto)
  redundancyProfile?: VdevProfileResponseDto;

  @Expose() memberCount?: number;
  @Expose()
  @Transform(({ obj }) => {
    const value = obj as { capacity?: VdevCapacity };
    return value.capacity;
  })
  capacity?: VdevCapacity;
  @Expose()
  @Type(() => VdevMemberShallowDto)
  members?: VdevMemberShallowDto[];
}
