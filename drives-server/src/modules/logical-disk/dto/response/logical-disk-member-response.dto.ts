import { Expose, Type } from 'class-transformer';
import { VdevMemberRole } from '../../entities/logical-disk.entity';

class VdevShallowDto {
  @Expose() id: string;
  @Expose() vdevName: string;
  @Expose() storagePoolId: string;
}

class DriveShallowDto {
  @Expose() id: string;
  @Expose() label: string;
  @Expose() serialNumber: string;
  @Expose() driveModelId: string;
  @Expose() driveModelName?: string | null;
  @Expose() absoluteCapacity?: number | null;
}

export class LogicalDiskMemberResponseDto {
  @Expose() id: string;
  @Expose() displayKey: number;
  @Expose() logicalVdevId: string;
  @Expose() physicalDriveId: string;
  @Expose() osDeviceNodePath: string | null;
  @Expose() memberRole: VdevMemberRole;
  @Expose() memberIndex: number;
  @Expose() groupIndex: number | null;
  @Expose() attachedAt: Date;
  @Expose() @Type(() => VdevShallowDto) logicalVdev?: VdevShallowDto;
  @Expose() @Type(() => DriveShallowDto) physicalDrive?: DriveShallowDto;

  constructor(partial: Partial<LogicalDiskMemberResponseDto>) {
    Object.assign(this, partial);
  }
}
