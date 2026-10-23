import { Expose, Type } from 'class-transformer';
import { VdevMemberRole } from '../../entities/logical-disk.entity';
import { VdevMembershipAction } from '../../entities/logical-disk-event.entity';

class DriveShallowDto {
  @Expose() id: string;
  @Expose() label: string;
  @Expose() serialNumber: string;
}

export class LogicalDiskEventResponseDto {
  @Expose() id: string;
  @Expose() displayKey: number;
  @Expose() action: VdevMembershipAction;
  @Expose() physicalDriveId: string;
  @Expose() logicalVdevId: string | null;
  @Expose() fromVdevId: string | null;
  @Expose() toVdevId: string | null;
  @Expose() memberRole: VdevMemberRole | null;
  @Expose() memberIndex: number | null;
  @Expose() groupIndex: number | null;
  @Expose() osDeviceNodePath: string | null;
  @Expose() eventTimestamp: Date;
  @Expose() performedByUserId: string | null;
  @Expose() correlationId: string | null;
  @Expose() notes: string | null;
  @Expose() contextMetadata: Record<string, unknown> | null;
  @Expose() @Type(() => DriveShallowDto) physicalDrive?: DriveShallowDto;
}
