import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VdevCapacityMode,
  VdevTechnology,
} from '../entities/vdev-profile.entity';

export class CreateVdevProfileDto {
  @ApiProperty({ example: 'RAIDZ2' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be uppercase letters, digits and underscores',
  })
  code: string;

  @ApiProperty({ example: 'RAIDZ2' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  displayName: string;

  @ApiPropertyOptional({
    enum: VdevTechnology,
    default: VdevTechnology.GENERIC,
  })
  @IsOptional()
  @IsEnum(VdevTechnology)
  technology?: VdevTechnology;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minMembers?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxMembers?: number | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  parityMembers?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  mirrorCopies?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  stripeWidth?: number | null;

  @ApiPropertyOptional({
    enum: VdevCapacityMode,
    default: VdevCapacityMode.SUM,
  })
  @IsOptional()
  @IsEnum(VdevCapacityMode)
  capacityMode?: VdevCapacityMode;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
