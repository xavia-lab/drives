import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DriveLifecycleEventType } from '../../drive-lifecycle-event/entities/drive-lifecycle-event.entity';

// Reasons a drive can be left unseated by the allocation workflow. RMA and
// informational events deliberately belong to other workflows.
export const UNSEATED_DRIVE_LIFECYCLE_EVENTS = [
  DriveLifecycleEventType.DEPROVISION,
  DriveLifecycleEventType.DEGRADE,
  DriveLifecycleEventType.FAIL,
  DriveLifecycleEventType.RETIRE,
  DriveLifecycleEventType.SCRAP_SHRED,
  DriveLifecycleEventType.LOST,
] as const;

export class DetachedDriveStateDto {
  @ApiProperty({
    description: 'The detached drive that is not seated on the target',
    example: '019f6a00-0000-7f01-8f01-000000000041',
  })
  @IsUUID('7', {
    message: 'The physicalDriveId must be a valid UUIDv7 string',
  })
  physicalDriveId: string;

  @ApiProperty({
    description: 'The lifecycle state to record for the unseated drive',
    enum: UNSEATED_DRIVE_LIFECYCLE_EVENTS,
    example: DriveLifecycleEventType.DEPROVISION,
  })
  @IsIn(UNSEATED_DRIVE_LIFECYCLE_EVENTS)
  eventType: (typeof UNSEATED_DRIVE_LIFECYCLE_EVENTS)[number];

  @ApiPropertyOptional({
    description:
      'Optional operator explanation stored in the lifecycle event contextMetadata',
    example: 'Removed from service while decommissioning the host.',
  })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class SlotAllocationItemDto {
  @ApiProperty({
    description: 'The target server slot to seat the drive in',
    example: '019f6a00-0000-7e00-8e00-00000000000d',
  })
  @IsUUID('7', { message: 'The slotId must be a valid UUIDv7 string' })
  slotId: string;

  @ApiProperty({
    description: 'The drive to seat in the slot',
    example: '019f6a00-0000-7f01-8f01-000000000041',
  })
  @IsUUID('7', {
    message: 'The physicalDriveId must be a valid UUIDv7 string',
  })
  physicalDriveId: string;
}

/**
 * Drive Allocation workflow payload. It can detach drives from a source
 * server and/or seat drives into a target server's slots, atomically.
 */
export class AllocateDrivesDto {
  @ApiProperty({
    description: 'The datacenter both servers and drives must belong to',
    example: '019f6a00-0000-7a01-8a01-000000000001',
  })
  @IsUUID('7', { message: 'The datacenterId must be a valid UUIDv7 string' })
  datacenterId: string;

  @ApiPropertyOptional({
    description:
      'Optional source server whose selected drives will be unmounted',
    example: '019f6a00-0000-7d13-8d13-000000000053',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The sourceServerId must be a valid UUIDv7 string' })
  sourceServerId?: string;

  @ApiPropertyOptional({
    description:
      'Drives to detach from the source server. Detached drives that are not assigned to the target are left unseated.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('7', {
    each: true,
    message: 'Each detachDriveId must be a valid UUIDv7 string',
  })
  detachDriveIds?: string[];

  @ApiPropertyOptional({
    description: 'Optional target server that will receive drives',
    example: '019f6a00-0000-7d14-8d14-000000000054',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The targetServerId must be a valid UUIDv7 string' })
  targetServerId?: string;

  @ApiPropertyOptional({
    description:
      'Complete set of desired slot -> drive seats for the target server. Omitted empty slots stay empty; existing target occupants are left untouched.',
    type: [SlotAllocationItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotAllocationItemDto)
  assignments?: SlotAllocationItemDto[];

  @ApiPropertyOptional({
    description:
      'Lifecycle state for every detached drive that is NOT seated on the target. Must match exactly that set of drives.',
    type: [DetachedDriveStateDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetachedDriveStateDto)
  unseatedDriveStates?: DetachedDriveStateDto[];
}
