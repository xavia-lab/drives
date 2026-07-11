import { PartialType } from '@nestjs/swagger';
import { CreateCurrencyDto } from './create-currency.dto';
import { IsOptional, IsBoolean, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Using PartialType to make all fields optional
export class UpdateCurrencyDto extends PartialType(CreateCurrencyDto) {
  @ApiPropertyOptional({ example: 'Euro', description: 'Currency name' })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  name?: string;

  @ApiPropertyOptional({ example: 'EUR', description: 'Currency code' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  code?: string;

  @ApiPropertyOptional({ example: '€', description: 'Currency symbol' })
  @IsOptional()
  @IsString()
  @Length(1, 3)
  symbol?: string;

  @ApiPropertyOptional({ example: false, description: 'Is system-managed' })
  @IsOptional()
  @IsBoolean()
  managed?: boolean;
}
