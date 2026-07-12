import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServerSlotDto {
  @ApiPropertyOptional({
    example: '019f5431-1bf4-74cf-8da9-6c3905bb4e2d',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description:
      'Relational link pointer reference ID connecting to the hosting server chassis framework',
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    required: true,
  })
  @IsUUID('7', { message: 'The serverId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  serverId: string;

  @ApiProperty({
    description:
      'The distinct physical front plate text imprint case label designation tracking marker',
    maxLength: 32,
    example: 'Bay 0',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  slotLabel: string;

  @ApiProperty({
    description:
      'Relational link pointer reference ID linking to the backplane communication protocol standard',
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    required: true,
  })
  @IsUUID('7', {
    message: 'The supportedInterfaceId must be a valid UUIDv7 string',
  })
  @IsNotEmpty()
  supportedInterfaceId: string;

  @ApiPropertyOptional({
    description:
      'Alphanumeric PCIe expansion domain controller hardware topology physical memory routing bus mapping key',
    maxLength: 32,
    example: '0000:41:00.0',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  pcieBusAddress?: string;
}
