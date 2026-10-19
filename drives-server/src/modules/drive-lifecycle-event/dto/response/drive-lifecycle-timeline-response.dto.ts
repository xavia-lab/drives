import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DriveLifecycleState } from '../../entities/drive-lifecycle-event.entity';
import { DriveLifecycleEventResponseDto } from './drive-lifecycle-event-response.dto';

// Full lifecycle timeline for a single drive: the derived current state plus
// every appended event in ascending chronological order.
export class DriveLifecycleTimelineResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The physical drive this timeline belongs to',
  })
  physicalDriveId: string;

  @Expose()
  @ApiProperty({
    enum: DriveLifecycleState,
    example: DriveLifecycleState.IN_SERVICE,
  })
  currentState: DriveLifecycleState;

  @Expose()
  @Type(() => DriveLifecycleEventResponseDto)
  @ApiPropertyOptional({
    type: () => DriveLifecycleEventResponseDto,
    nullable: true,
    description:
      'The latest state-changing event (null when the drive has no history)',
  })
  currentEvent: DriveLifecycleEventResponseDto | null;

  @Expose()
  @Type(() => DriveLifecycleEventResponseDto)
  @ApiProperty({
    type: () => DriveLifecycleEventResponseDto,
    isArray: true,
  })
  events: DriveLifecycleEventResponseDto[];
}
