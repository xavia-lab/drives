import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLogicalDiskDto {
  @ApiPropertyOptional({
    example: '019f5431-1bf4-72fd-a9c0-5a396eb14ea1',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description:
      'Relational link pointer reference ID connecting to the parent hosting virtual device layout configuration',
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    required: true,
  })
  @IsUUID('7', { message: 'The logicalVdevId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  logicalVdevId: string;

  @ApiProperty({
    description:
      'Relational link pointer reference ID linking onto the physical raw hardware disk block array device mapping',
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e31',
    required: true,
  })
  @IsUUID('7', { message: 'The physicalDriveId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  physicalDriveId: string;

  @ApiProperty({
    description:
      'The kernel device path assignment indicator mapping value (e.g., /dev/nvme0n1, /dev/sda)',
    maxLength: 32,
    example: '/dev/nvme0n1',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  osDeviceNodePath: string;

  @ApiPropertyOptional({
    description:
      'Logical operations flag identifying if this disk is configured explicitly as a hot-spare spare node member',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSpareDrive?: boolean;
}
