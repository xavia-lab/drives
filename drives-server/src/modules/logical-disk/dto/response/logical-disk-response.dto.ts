import { Expose, Type } from 'class-transformer';
import { VdevMemberRole } from '../../entities/logical-disk.entity';

class LogicalVdevShallowDto {
  @Expose() id: string;
  @Expose() vdevName: string;
}

class PhysicalDriveShallowDto {
  @Expose() id: string;
  @Expose() label: string;
  @Expose() serialNumber: string;
  @Expose() driveModelId: string;
}

export class LogicalDiskResponseDto {
  @Expose() displayKey: number;
  @Expose() id: string;
  @Expose() logicalVdevId: string;
  @Expose() physicalDriveId: string;
  @Expose() osDeviceNodePath: string | null;
  @Expose() memberRole: VdevMemberRole;
  @Expose() memberIndex: number;
  @Expose() groupIndex: number | null;
  @Expose() attachedAt: Date;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
  @Expose()
  @Type(() => LogicalVdevShallowDto)
  logicalVdev?: LogicalVdevShallowDto;
  @Expose()
  @Type(() => PhysicalDriveShallowDto)
  physicalDrive?: PhysicalDriveShallowDto;
}
