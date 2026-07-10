import { PartialType } from '@nestjs/swagger';
import { CreateFormFactorDto } from './create-form-factor.dto';
import {
  IsOptional,
  IsBoolean,
  IsString,
  Length,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Using PartialType to make all fields optional
export class UpdateFormFactorDto extends PartialType(CreateFormFactorDto) {
  @ApiPropertyOptional({ example: '2.5 inch', description: 'Form factor name' })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @ApiPropertyOptional({ example: '4.2', description: 'Slot pitch (mm)' })
  @IsNumber()
  @IsOptional()
  slotPitch?: number;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
