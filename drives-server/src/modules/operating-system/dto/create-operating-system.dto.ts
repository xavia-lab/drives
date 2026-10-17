import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOperatingSystemDto {
  @ApiPropertyOptional({
    example: '019f5431-1bf4-73bc-9d1a-5b32e0bc2754',
    type: String,
  })
  @IsOptional()
  @IsUUID('7')
  id?: string;

  @ApiProperty({
    description: 'Display name profile target',
    maxLength: 64,
    example: 'Proxmox VE 8.x',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  name: string;

  @ApiPropertyOptional({
    description: 'Upstream release codename',
    maxLength: 64,
    example: 'Bookworm',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  codeName?: string;

  @ApiPropertyOptional({
    description: 'OS maintenance developer brand',
    maxLength: 64,
    example: 'Proxmox',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Upstream distribution family / lineage',
    maxLength: 64,
    example: 'Debian',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  family?: string;

  @ApiPropertyOptional({
    description: 'Major release version number',
    example: 24,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  majorVersion?: number;

  @ApiPropertyOptional({
    description: 'Minor release version number',
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minorVersion?: number;

  @ApiPropertyOptional({
    description: 'End-of-life calendar date in YYYY-MM-DD syntax',
    example: '2029-04-30',
  })
  @IsOptional()
  @IsDateString()
  eolDate?: string;
}
