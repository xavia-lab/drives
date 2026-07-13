import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRackDto {
  @ApiPropertyOptional({
    example: '019f5431-1bf4-72fd-a9c0-5a396eb14ea1',
    type: String,
  })
  @IsOptional()
  @IsUUID('7')
  id?: string;

  @ApiProperty({
    description: 'Hardware cabinet tag reference alphanumeric designator',
    maxLength: 32,
    example: 'RACK-B12',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  name: string;

  @ApiProperty({
    description: 'Parent building identifier',
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
  })
  @IsUUID('7')
  @IsNotEmpty()
  datacenterId: string;

  @ApiPropertyOptional({
    description: 'Total vertical height capacity layout in structural units',
    example: 42,
    default: 42,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalRackUnits?: number;
}
