import { PartialType } from '@nestjs/swagger';
import { CreateCapacityDto } from './create-capacity.dto';
import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  Length,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Using PartialType to make all fields optional
export class UpdateCapacityDto extends PartialType(CreateCapacityDto) {
  @ApiPropertyOptional({ example: '120GB', description: 'Capacity name' })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @ApiPropertyOptional({ example: '120.00', description: 'Capacity value' })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ example: 'GB', description: 'Capacity unit' })
  @IsOptional()
  @IsString()
  @Length(1, 3)
  unit?: string;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
