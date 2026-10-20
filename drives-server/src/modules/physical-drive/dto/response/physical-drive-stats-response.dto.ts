import { Expose, Type } from 'class-transformer';

export class DatacenterDriveCountDto {
  @Expose()
  datacenterId: string;

  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  count: number;
}

export class PhysicalDriveStatsResponseDto {
  @Expose()
  total: number;

  @Expose()
  assigned: number;

  @Expose()
  unassigned: number;

  @Expose()
  @Type(() => DatacenterDriveCountDto)
  byDatacenter: DatacenterDriveCountDto[];
}
