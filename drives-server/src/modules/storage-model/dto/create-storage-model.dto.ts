import {
  IsString,
  IsNotEmpty,
  Length,
  IsInt,
  Min,
  IsOptional,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateVendorDto } from '../../vendor/dto/create-vendor.dto';

export class CreateStorageModelDto {
  @ApiPropertyOptional({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  id?: string;

  @ApiProperty({
    description:
      'The physical manufacturer model classification designation name',
    example: 'Exos X24',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  name: string;

  @ApiProperty({
    description:
      'The physical manufacturer model classification designation number',
    example: 'ST16000NM007H',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  modelNumber: string;

  @ApiProperty({
    description:
      'Maximum guaranteed structural lifetime Terabytes Written rating threshold',
    example: 14000,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxEnduranceTbw?: number | null;

  @ApiProperty({
    description:
      'The relational primary key index linking to the manufacturing vendor record',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  manufacturerId: string;

  @ApiProperty({
    description:
      'The relational primary key index defining the core media physics technology type',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  storageTypeId: string;

  @ApiProperty({
    description:
      'The relational primary key index confirming physical slot shape properties',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  formFactorId: string;

  @ApiProperty({
    description:
      'The relational primary key index establishing link interface layer capabilities',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  interfaceId: string;

  @ApiProperty({
    description:
      'The relational primary key index mapping the explicit block sector boundaries',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' }) // Enforces UUIDv7 formatting
  capacityId: string;

  @ApiProperty({
    description:
      'Optional nested manufacturer parameters for cascading creation pipelines',
    type: CreateVendorDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVendorDto)
  manufacturer?: CreateVendorDto;
}
