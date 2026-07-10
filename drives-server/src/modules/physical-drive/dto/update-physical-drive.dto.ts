import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { CreatePhysicalDriveDto } from './create-physical-drive.dto';

export class UpdatePhysicalDriveDto extends PartialType(
  CreatePhysicalDriveDto,
) {
  @ApiPropertyOptional({
    description:
      'The unique alphanumeric serial number printed directly on the drive case chassis label',
    example: 'PHG2134001A87-REV2',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  override serialNumber?: string; // Explicit override keyword for clear TypeScript compilation paths
}
