import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DriveLifecycleEventType } from '../entities/drive-lifecycle-event.entity';

export class CreateDriveLifecycleEventDto {
  @ApiProperty({
    description:
      'The primary key numerical index matching the targeted physical drive asset',
    example: 45,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  physicalDriveId: number;

  @ApiProperty({
    description:
      'The specific operational milestone status category to append to the drive history timeline',
    enum: DriveLifecycleEventType,
    example: DriveLifecycleEventType.PROVISION,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(DriveLifecycleEventType, {
    message: `eventType must be a valid value: ${Object.values(DriveLifecycleEventType).join(', ')}`,
  })
  eventType: DriveLifecycleEventType;

  @ApiProperty({
    description:
      'The identification moniker of the automation daemon, service node, or human worker committing this entry',
    example: 'system_agent_node_42',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 128)
  triggeredBy: string;

  @ApiPropertyOptional({
    description:
      'Flexible key-value payload to store structural diagnostic metrics, runtime telemetry, or failure codes',
    example: {
      firmware_version: 'HP04',
      bad_block_count: 0,
      raw_temperature_celsius: 34,
    },
    // type: 'object',
    required: false,
  })
  @IsOptional()
  @IsObject()
  contextMetadata?: Record<string, any>;
}
