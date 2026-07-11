import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStorageModelDto } from './create-storage-model.dto';
import { UpdateVendorDto } from '../../vendor/dto/update-vendor.dto';

export class UpdateStorageModelDto extends PartialType(
  OmitType(CreateStorageModelDto, ['manufacturer'] as const),
) {
  @ApiPropertyOptional({
    description:
      'The physical manufacturer model classification designation name',
    example: 'PM1733a',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  override name?: string; // Using explicit override keyword for clean TypeScript compilation paths

  @ApiPropertyOptional({
    description:
      'Optional nested manufacturer parameters for patching cascading structural definitions',
    required: false,
    type: UpdateVendorDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateVendorDto)
  manufacturer?: UpdateVendorDto;
}
