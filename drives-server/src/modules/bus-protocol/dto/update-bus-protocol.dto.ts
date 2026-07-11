import { PartialType } from '@nestjs/swagger';
import { CreateBusProtocolDto } from './create-bus-protocol.dto';
import { IsOptional, IsBoolean, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Using PartialType to make all fields optional
export class UpdateBusProtocolDto extends PartialType(CreateBusProtocolDto) {
  @ApiPropertyOptional({
    example: 'Magnatic',
    description: 'Storage type name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @ApiPropertyOptional({
    example: 'ATA',
    description: 'Bus protocol command set',
  })
  @IsString()
  @IsOptional()
  @Length(1, 16)
  command_set?: string;

  @ApiPropertyOptional({
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  supports_hot_plug?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
