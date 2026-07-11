import {
  IsString,
  IsNotEmpty,
  Length,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCapacityDto {
  @ApiPropertyOptional({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  id?: string;

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
