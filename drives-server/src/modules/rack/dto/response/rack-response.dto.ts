import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DatacenterShallowDto {
  @Expose()
  @ApiProperty({ example: '019f4fa1-57db-72d7-b037-2f35d54f2794' })
  id: string;
  @Expose() @ApiProperty({ example: 'VA-ASH-1' }) code: string;
}

export class RackResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  itemNumber: number;

  @Expose()
  @ApiProperty({ example: '019f5431-1bf4-72fd-a9c0-5a396eb14ea1' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'RACK-B12' })
  name: string;

  @Expose()
  @ApiProperty({ example: '019f4fa1-57db-72d7-b037-2f35d54f2794' })
  datacenterId: string;

  @Expose()
  @ApiProperty({ example: 42 })
  totalRackUnits: number;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  updatedAt: Date;

  @Expose()
  @Type(() => DatacenterShallowDto)
  @ApiProperty({ type: DatacenterShallowDto })
  datacenter: DatacenterShallowDto;
}
