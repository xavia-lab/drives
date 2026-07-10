import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUrl,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateCountryDto } from '../../country/dto/create-country.dto';

export class CreateVendorDto {
  @ApiProperty({
    description: 'The global business name of the hardware vendor',
    example: 'Solidigm',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  name: string;

  @ApiProperty({
    description:
      'Flags whether this vendor builds raw physical components/media',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isManufacturer?: boolean;

  @ApiProperty({
    description: 'Flags whether this vendor sells finished goods/supplies',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRetailer?: boolean;

  @ApiProperty({
    description: 'Enterprise point of contact for technical support or RMAs',
    example: 'enterprise.support@solidigm.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @Length(1, 128)
  supportContactEmail?: string;

  @ApiProperty({
    description:
      'Direct link to the vendor corporate service/warranty dashboard',
    example: 'https://solidigm.com',
    required: false,
  })
  @IsOptional()
  @IsUrl({ require_tld: true })
  @Length(1, 255)
  portalUrl?: string;

  @ApiProperty({
    description: 'Flags if the item is a baseline system-managed lookup record',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;

  @ApiProperty({
    description:
      'The primary key numerical identifier matching the country database record',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  countryId: number;

  @ApiProperty({
    description:
      'Optional nested country parameters for cascading creation pipelines',
    type: CreateCountryDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCountryDto)
  country?: CreateCountryDto;
}
