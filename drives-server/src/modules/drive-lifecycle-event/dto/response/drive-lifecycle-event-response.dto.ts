import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DriveLifecycleEventType } from '../../entities/drive-lifecycle-event.entity';
import { PhysicalDriveResponseDto } from '../../../physical-drive/dto/response/physical-drive-response.dto';

export class DriveLifecycleEventResponseDto {
  @ApiProperty({
    description: 'The unique numerical identifier of the event record',
    example: 1042,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description:
      'The unique numerical foreign key identifier linking back to the asset record',
    example: 45,
  })
  @Expose()
  physicalDriveId: number;

  @ApiProperty({
    description: 'The distinct operational categorization milestone type',
    enum: DriveLifecycleEventType,
    example: 'PROVISION',
  })
  @Expose()
  eventType: DriveLifecycleEventType;

  @ApiProperty({
    description:
      'The absolute execution time timestamp when the telemetry event occurred',
    example: '2026-07-09T15:26:00.000Z',
  })
  @Expose()
  eventTimestamp: Date;

  @ApiProperty({
    description:
      'The automation runner name or operator tag who recorded the event',
    example: 'system_agent_node_42',
  })
  @Expose()
  triggeredBy: string;

  @ApiProperty({
    description:
      'Flexible key-value storage block holding raw metric telemetry logs, S.M.A.R.T snapshots, or stack dumps',
    example: {
      firmware_version: 'HP04',
      bad_block_count: 0,
      raw_temperature_celsius: 34,
    },
    nullable: true,
  })
  @Expose()
  contextMetadata: Record<string, any> | null;

  @ApiProperty({
    description: 'The initial data capture database insertion timestamp',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'The last database modification update timestamp',
  })
  @Expose()
  updatedAt: Date;

  // --- Optional Shallow Associations ---

  @ApiProperty({
    description:
      'The nested detailed footprint of the targeted physical asset record',
    type: () => PhysicalDriveResponseDto,
    required: false,
  })
  @Expose()
  @Type(() => PhysicalDriveResponseDto)
  physicalDrive?: PhysicalDriveResponseDto;

  constructor(partial: Partial<DriveLifecycleEventResponseDto>) {
    Object.assign(this, partial);
  }
}
