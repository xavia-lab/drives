import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServerSlotActionType } from '../entities/server-slot-allocation.entity';

export class CreateServerSlotAllocationDto {
  @ApiPropertyOptional({
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description:
      'The physical action execution operation to append into the system ledger',
    enum: ServerSlotActionType,
    example: ServerSlotActionType.MOUNT,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(ServerSlotActionType, {
    message: 'The actionType must match allowed entries (MOUNT, UNMOUNT)',
  })
  actionType: ServerSlotActionType;

  @ApiProperty({
    description:
      'Relational link pointer ID connecting to the hardware target chassis server slot footprint',
    example: '019f5431-1bf4-74cf-8da9-6c3905bb4e2d',
    required: true,
  })
  @IsUUID('7', { message: 'The serverSlotId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  serverSlotId: string;

  @ApiProperty({
    description:
      'Relational link pointer ID connecting to the physical drive storage hardware element block asset',
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e31',
    required: true,
  })
  @IsUUID('7', { message: 'The physicalDriveId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  physicalDriveId: string;

  @ApiProperty({
    description:
      'The executing technician accountability Keycloak security identity identification UUID registry link',
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    required: true,
  })
  @IsUUID('7', { message: 'The userId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description:
      'Optional manual backdated operational time value string matching action completion window',
    example: '2026-07-13T05:01:22.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
