import {
  IsString,
  IsNotEmpty,
  Length,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStorageTypeDto {
  @ApiProperty({ example: 'Magnatic', description: 'Storage type name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  name: string;

  @ApiProperty({
    example: false,
    description: 'Storage system is capable of tracking wear leveling',
  })
  @IsNotEmpty()
  @IsBoolean()
  wearTrackable: boolean;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
