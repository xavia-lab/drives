import { PartialType } from '@nestjs/swagger';
import { CreateStorageTypeDto } from './create-storage-type.dto';
import { IsOptional, IsBoolean, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Using PartialType to make all fields optional
export class UpdateStorageTypeDto extends PartialType(CreateStorageTypeDto) {
  @ApiPropertyOptional({
    example: 'Magnatic',
    description: 'Storage type name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Storage system is capable of tracking wear leveling',
  })
  @IsOptional()
  @IsBoolean()
  wearTrackable?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
