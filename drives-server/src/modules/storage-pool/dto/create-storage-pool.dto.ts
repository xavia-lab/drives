import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoragePoolDto {
  @ApiPropertyOptional({
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description:
      'The distinctive descriptive name label tracking token of the disk block layer array pool',
    maxLength: 64,
    example: 'tank-nvme-cache',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  poolName: string;

  @ApiProperty({
    description:
      'Relational link pointer identifier referencing the storage pool type lookup record',
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The poolTypeId must be a valid UUIDv7 string' })
  poolTypeId: string;

  @ApiPropertyOptional({
    description:
      'Logical operations flag configuration parameter indicating encryption enforcement layer parameters',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  encryptionEnabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Relational link pointer identifier mapping onto physical hardware chassis node (mutually exclusive with virtualServerId)',
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    required: false,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The serverId must be a valid UUIDv7 string' })
  serverId?: string;

  @ApiPropertyOptional({
    description:
      'Relational link pointer identifier mapping onto virtualized guest machine node (mutually exclusive with serverId)',
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    required: false,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The virtualServerId must be a valid UUIDv7 string' })
  virtualServerId?: string;
}
