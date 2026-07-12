import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
} from 'class-validator';
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
    description: 'OS maintenance developer brand',
    maxLength: 64,
    example: 'Proxmox',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  vendor?: string;
}
