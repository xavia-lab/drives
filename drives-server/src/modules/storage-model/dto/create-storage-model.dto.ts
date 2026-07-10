import {
  IsString,
  IsNotEmpty,
  Length,
  IsInt,
  Min,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateVendorDto } from '../../vendor/dto/create-vendor.dto';

export class CreateStorageModelDto {
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
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  manufacturerId: number;

  @ApiProperty({
    description:
      'The relational primary key index defining the core media physics technology type',
    example: 2, // e.g., NAND Flash
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  storageTypeId: number;

  @ApiProperty({
    description:
      'The relational primary key index confirming physical slot shape properties',
    example: 10, // e.g., U.2
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  formFactorId: number;

  @ApiProperty({
    description:
      'The relational primary key index establishing link interface layer capabilities',
    example: 52, // e.g., NVMe PCIe G4
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  interfaceId: number;

  @ApiProperty({
    description:
      'The relational primary key index mapping the explicit block sector boundaries',
    example: 101, // e.g., 7.68TB
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  capacityId: number;

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
