import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CpuArchitecture } from '../../entities/cpu-model.entity';
import { VendorResponseDto } from '../../../vendor/dto/response/vendor-response.dto';

export class CpuModelResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  displayKey: number;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique UUIDv7 primary identifier of this CPU model',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: '019f52ee-f450-7484-b126-fed1b64c566e',
    description: 'The manufacturing vendor UUID link of the CPU',
  })
  vendorId: string;

  @Expose()
  @ApiProperty({
    enum: CpuArchitecture,
    example: CpuArchitecture.X86_64,
    description: 'The instruction-set architecture implemented by the CPU',
  })
  architecture: CpuArchitecture;

  @Expose()
  @ApiProperty({
    example: 'EPYC 7763',
    description: 'The market name identifier of the processor model',
  })
  name: string;

  @Expose()
  @ApiProperty({
    example: 64,
    description: 'Total number of discrete hardware physical processing cores',
  })
  physicalCores: number;

  @Expose()
  @ApiProperty({
    example: 128,
    description:
      'Total number of processing threads available via hyperthreading/SMT',
  })
  threads: number;

  @Expose()
  @ApiPropertyOptional({
    example: 280,
    description:
      'Thermal Design Power rated in watts for data center energy auditing',
  })
  tdpWatts: number | null;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  updatedAt: Date;

  // --- Nested Associations ---
  @Expose()
  @Type(() => VendorResponseDto)
  vendor?: VendorResponseDto;
}
