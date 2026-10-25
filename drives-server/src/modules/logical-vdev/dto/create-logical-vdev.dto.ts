import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VdevClass } from '../entities/logical-vdev.entity';

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
    description: 'Storage pool that owns this vdev',
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    required: true,
  })
  @IsUUID('7', { message: 'The storagePoolId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  storagePoolId: string;

  @ApiProperty({
    description: 'VDEV profile id (RAIDZ2, MIRROR, RAID5, ...)',
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    required: true,
  })
  @IsUUID('7', {
    message: 'The redundancyProfileId must be a valid UUIDv7 string',
  })
  @IsNotEmpty()
  redundancyProfileId: string;

  @ApiProperty({
    description: 'Unique vdev name within the pool, e.g. raidz2-0',
    example: 'raidz2-0',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  vdevName: string;

  @ApiPropertyOptional({
    enum: VdevClass,
    default: VdevClass.DATA,
    description: 'ZFS-style vdev class; DATA contributes pool capacity',
  })
  @IsOptional()
  @IsEnum(VdevClass)
  vdevClass?: VdevClass;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
