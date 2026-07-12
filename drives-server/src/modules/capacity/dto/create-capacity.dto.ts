import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Exported Enum to maintain standard data structure across validation layers
export enum CapacityUnit {
  B = 'B',
  KB = 'KB',
  MB = 'MB',
  GB = 'GB',
  TB = 'TB',
  PB = 'PB',
}

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

  @ApiProperty({
    example: 120.0,
    description: 'Capacity value matching DECIMAL(6,2) layout bounds',
    minimum: 0,
    maximum: 9999.99,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Value must be a number with maximum 2 decimal places' },
  )
  @IsNotEmpty()
  @Min(0, { message: 'Value cannot be negative' })
  @Max(9999.99, { message: 'Value cannot exceed 9999.99' })
  value: number;

  @ApiProperty({
    example: 'GB',
    description: 'Capacity unit enum token',
    enum: CapacityUnit,
  })
  @IsEnum(CapacityUnit, {
    message: `Unit must be one of the following values: ${Object.values(CapacityUnit).join(', ')}`,
  })
  @IsNotEmpty()
  unit: CapacityUnit;
}
