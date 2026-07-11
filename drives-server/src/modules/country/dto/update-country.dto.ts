import { PartialType } from '@nestjs/swagger';
import { CreateCountryDto } from './create-country.dto';
import { IsOptional, IsBoolean, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Using PartialType to make all fields optional
export class UpdateCountryDto extends PartialType(CreateCountryDto) {
  @ApiPropertyOptional({
    example: 'United Kingdom',
    description: 'Country name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  name?: string;

  @ApiPropertyOptional({ example: 'GB', description: 'Country code' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  code?: string;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
