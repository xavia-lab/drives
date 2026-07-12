import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VdevRedundancyProfile } from '../entities/logical-vdev.entity';

export class CreateLogicalVdevDto {
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
      'Relational link pointer reference ID connecting to the parent hosting storage pool framework',
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    required: true,
  })
  @IsUUID('7', { message: 'The storagePoolId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  storagePoolId: string;

  @ApiProperty({
    description:
      'The distinctive name label tracking token of the specific vdev layout configuration (e.g., raidz2-0, mirror-1)',
    maxLength: 32,
    example: 'raidz2-0',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  vdevName: string;

  @ApiProperty({
    description:
      'The mathematical parity arrangement topology architecture profile design type used to manage device disks',
    enum: VdevRedundancyProfile,
    example: VdevRedundancyProfile.RAIDZ2,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(VdevRedundancyProfile, {
    message:
      'The vdevRedundancyProfile must match supported options (STRIPE, MIRROR, RAIDZ1, RAIDZ2, RAIDZ3, JBOD_SINGLE)',
  })
  vdevRedundancyProfile: VdevRedundancyProfile;
}
