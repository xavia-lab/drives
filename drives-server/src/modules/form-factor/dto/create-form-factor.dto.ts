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

export class CreateFormFactorDto {
  @ApiPropertyOptional({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  id?: string;

  @ApiProperty({ example: 'M.2', description: 'Form factor name' })
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
