import {
  IsString,
  IsNotEmpty,
  Length,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFormFactorDto {
  @ApiProperty({ example: 'Magnatic', description: 'Form factor name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  name: string;

  @ApiProperty({ example: '4.2', description: 'Slot pitch (mm)' })
  @IsNumber()
  @IsOptional()
  slotPitch: number;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
