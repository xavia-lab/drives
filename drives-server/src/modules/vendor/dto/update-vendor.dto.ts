import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVendorDto } from './create-vendor.dto';
import { UpdateCountryDto } from '../../country/dto/update-country.dto';

export class UpdateVendorDto extends PartialType(
  OmitType(CreateVendorDto, ['country'] as const),
) {
  @ApiPropertyOptional({
    description: 'The global business name of the hardware vendor',
    example: 'Solidigm Corporate',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  name?: string; // Using explicit override keyword for clean TypeScript compilation paths

  @ApiPropertyOptional({
    description:
      'Optional nested country parameters for patching cascading structural definitions',
    required: false,
    type: UpdateCountryDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCountryDto)
  country?: UpdateCountryDto;
}
