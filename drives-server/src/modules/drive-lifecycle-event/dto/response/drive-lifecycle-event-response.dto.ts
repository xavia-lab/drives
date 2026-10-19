import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DriveLifecycleEventType } from '../../entities/drive-lifecycle-event.entity';
import { PhysicalDriveResponseDto } from '../../../physical-drive/dto/response/physical-drive-response.dto';

export class DriveLifecycleEventResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The unique UUIDv7 identifier of the event record',
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'The consistent global sequential index number',
    example: 1042,
  })
  displayKey: number;

  @Expose()
  @ApiProperty({
    description:
      'The foreign key identifier linking back to the physical drive asset',
    type: String,
  })
  physicalDriveId: string;

  @Expose()
  @ApiProperty({
    description: 'The distinct operational milestone action type',
    enum: DriveLifecycleEventType,
    example: DriveLifecycleEventType.PROVISION,
  })
  eventType: DriveLifecycleEventType;

  @Expose()
  @ApiProperty({
    description:
      'The absolute execution time timestamp when the telemetry event occurred',
    example: '2026-07-09T15:26:00.000Z',
  })
  eventTimestamp: Date;

  @Expose()
  @ApiProperty({
    description:
      'The automation runner name or operator tag who recorded the event',
    example: 'system_agent_node_42',
  })
  triggeredBy: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'The database user id of the operator who recorded the event',
    nullable: true,
  })
  performedByUserId: string | null;

  @Expose()
  @ApiPropertyOptional({
    description:
      'The successor drive shipped for an RMA_REPLACE event (null otherwise)',
    nullable: true,
  })
  replacementPhysicalDriveId: string | null;

  @Expose()
  @ApiPropertyOptional({
    description:
      'Flexible key-value block holding diagnostic metrics, failure codes or notes',
    example: {
      failure_code: 'SMART_REALLOCATED_SECTOR_COUNT',
      rma_tracking_number: 'RMA-990PRO-12345',
    },
    nullable: true,
  })
  // `contextMetadata` is arbitrary JSON, so it must be passed through verbatim:
  // with `excludeExtraneousValues` class-transformer otherwise collapses an
  // `Object`-typed value into `{}` (see SerializeInterceptor).
  @Transform(({ obj, key }) => (obj as Record<string, unknown>)[key])
  contextMetadata: Record<string, unknown> | null;

  @Expose()
  @ApiProperty({
    description: 'The initial data capture database insertion timestamp',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'The last database modification update timestamp',
  })
  updatedAt: Date;

  // --- Optional Shallow Associations ---

  @Expose()
  @Type(() => PhysicalDriveResponseDto)
  @ApiPropertyOptional({
    type: () => PhysicalDriveResponseDto,
    description: 'The targeted physical drive asset',
  })
  physicalDrive?: PhysicalDriveResponseDto;

  @Expose()
  @Type(() => PhysicalDriveResponseDto)
  @ApiPropertyOptional({
    type: () => PhysicalDriveResponseDto,
    description: 'The linked replacement drive (RMA_REPLACE events only)',
  })
  replacementDrive?: PhysicalDriveResponseDto | null;

  constructor(partial: Partial<DriveLifecycleEventResponseDto>) {
    Object.assign(this, partial);
  }
}
