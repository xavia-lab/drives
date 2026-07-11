import {
  IsString,
  IsNotEmpty,
  Length,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCapacityDto {
  @ApiProperty({ example: '120GB', description: 'Capacity name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  name: string;

  @ApiProperty({ example: '120.00', description: 'Capacity value' })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({ example: 'GB', description: 'Capacity unit' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 3)
  unit: string;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
