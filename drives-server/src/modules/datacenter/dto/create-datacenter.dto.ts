import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDatacenterDto {
  @ApiPropertyOptional({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description:
      'Unique facility naming key code identifier (e.g., VA-ASH-1, LON-SLO-2)',
    maxLength: 16,
    example: 'VA-ASH-1',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 16)
  code: string;

  @ApiProperty({
    description: 'User friendly name description of the datacenter facility',
    maxLength: 128,
    example: 'Ashburn Corporate Center 1',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  name: string;

  @ApiProperty({
    description: 'The city where the facility is physically located',
    maxLength: 64,
    example: 'Ashburn',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  city: string;

  @ApiProperty({
    description: 'The parent country ID associated with this datacenter',
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    required: true,
  })
  @IsUUID('7', { message: 'The countryId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  countryId: string;
}
