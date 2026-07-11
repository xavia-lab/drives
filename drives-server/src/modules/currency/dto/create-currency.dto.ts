import {
  IsString,
  IsNotEmpty,
  Length,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @ApiPropertyOptional({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  id?: string;

  @ApiProperty({ example: 'US Dollar', description: 'Currency name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  name: string;

  @ApiProperty({ example: 'USD', description: 'Currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  code: string;

  @ApiProperty({ example: '$', description: 'Currency symbol' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 3)
  symbol: string;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
