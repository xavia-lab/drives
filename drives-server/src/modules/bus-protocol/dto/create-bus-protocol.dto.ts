import {
  IsString,
  IsNotEmpty,
  Length,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusProtocolDto {
  @ApiProperty({ example: 'SATA', description: 'Bus protocol name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  name: string;

  @ApiProperty({ example: 'ATA', description: 'Bus protocol command set' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 16)
  commandSet: string;

  @ApiProperty({
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  supportsHotPlug: boolean;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
