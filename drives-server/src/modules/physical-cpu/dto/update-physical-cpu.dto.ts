import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { CreatePhysicalCpuDto } from './create-physical-cpu.dto';

export class UpdatePhysicalCpuDto extends PartialType(CreatePhysicalCpuDto) {
  @ApiPropertyOptional({
    description:
      'The unique alphanumeric serial number printed directly on the CPU heat-spreader (IHS) or packaging label',
    example: 'BF2104S00012-REV2',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  override serialNumber?: string; // Explicit override keyword for clear TypeScript compilation paths
}
