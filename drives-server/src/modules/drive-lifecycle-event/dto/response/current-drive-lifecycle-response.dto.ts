import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DriveLifecycleEventType,
  DriveLifecycleState,
} from '../../entities/drive-lifecycle-event.entity';

// Derived lifecycle snapshot for a drive: the state plus the latest
// state-changing event that produced it (null when the drive has no history).
export class CurrentDriveLifecycleDto {
  @Expose()
  @ApiProperty({
    enum: DriveLifecycleState,
    example: DriveLifecycleState.IN_SERVICE,
  })
  state: DriveLifecycleState;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  eventId: string | null;

  @Expose()
  @ApiPropertyOptional({ enum: DriveLifecycleEventType, nullable: true })
  eventType: DriveLifecycleEventType | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  eventTimestamp: Date | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  performedByUserId: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  triggeredBy: string | null;
}
