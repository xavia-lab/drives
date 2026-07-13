import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CpuVendor } from '../../entities/cpu-model.entity';

export class CpuModelResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  itemNumber: number;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique UUIDv7 primary identifier of this CPU model',
  })
  id: string;

  @Expose()
  @ApiProperty({
    enum: CpuVendor,
    example: CpuVendor.AMD,
    description: 'The manufacturer vendor of the CPU chip architecture',
  })
  vendor: CpuVendor;

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
}
