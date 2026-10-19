import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DatacenterShallowDto {
  @Expose()
  @ApiProperty({ example: '019f6a00-0000-7a01-8a01-000000000001' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'VA-ASH-1' })
  code: string;

  @Expose()
  @ApiProperty({ example: 'Ashburn Data Center 1' })
  name: string;
}

export class CurrentPhysicalDriveLocationDto {
  @Expose()
  @ApiProperty({ example: '019f6a70-0000-7e70-8e70-000000000001' })
  id: string;

  @Expose()
  @ApiProperty({ example: '019f6a00-0000-7a01-8a01-000000000001' })
  datacenterId: string;

  @Expose()
  @ApiProperty({ example: 'VA-ASH-1' })
  code: string;

  @Expose()
  @ApiProperty({ example: 'Ashburn Data Center 1' })
  name: string;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  locatedAt: Date;

  @Expose()
  @ApiPropertyOptional()
  notes: string | null;
}

export class PhysicalDriveLocationResponseDto {
  @Expose()
  @ApiProperty({ example: '019f6a70-0000-7e70-8e70-000000000001' })
  id: string;

  @Expose()
  @ApiProperty({ example: 1 })
  displayKey: number;

  @Expose()
  @ApiProperty({ example: '019f5431-1bf4-7e4b-accd-617e39d8a372' })
  physicalDriveId: string;

  @Expose()
  @ApiProperty({ example: '019f6a00-0000-7a01-8a01-000000000001' })
  datacenterId: string;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  locatedAt: Date;

  @Expose()
  @ApiPropertyOptional()
  notes: string | null;

  @Expose()
  @Type(() => DatacenterShallowDto)
  @ApiPropertyOptional({ type: DatacenterShallowDto })
  datacenter: DatacenterShallowDto | null;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  createdAt: Date;
}
