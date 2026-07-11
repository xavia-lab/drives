import {
  IsString,
  IsNotEmpty,
  Length,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInterfaceDto {
  @ApiPropertyOptional({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  id?: string;

  @ApiProperty({
    description: 'Name of the Interface',
    maxLength: 32,
    example: 'SATA III',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  name: string;

  @ApiProperty({
    description: 'The link generation',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  linkGeneration: number;

  @ApiProperty({
    description: 'Interface throughput in Gbps',
  })
  @IsNumber()
  @IsNotEmpty()
  throughput: number;

  @ApiProperty({
    description: 'The bus protocol id',
    required: true,
  })
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  @IsNotEmpty()
  busProtocolId: string;
}
