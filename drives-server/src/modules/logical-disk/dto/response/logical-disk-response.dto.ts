import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class LogicalVdevShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    description: 'The unique identifier of the virtual device group',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'raidz2-0',
    description: 'The assigned name identifier of the logical vdev',
  })
  vdevName: string;
}

class PhysicalDriveShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e31',
    description: 'The unique identifier of the physical drive',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'S3X0NX0A123456',
    description: 'The actual hardware serial number of the drive asset',
  })
  serialNumber: string;
}

export class LogicalDiskResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  itemNumber: number;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-72fd-a9c0-5a396eb14ea1',
    description:
      'The unique UUIDv7 primary identifier of this logical disk record',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    description:
      'Relational link pointer ID connecting to the virtual device array group member',
  })
  logicalVdevId: string;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e31',
    description:
      'Relational link pointer ID connecting to the actual underlying physical hardware drive block asset',
  })
  physicalDriveId: string;

  @Expose()
  @ApiProperty({
    example: '/dev/nvme0n1',
    description:
      'The operating system kernel device block attachment endpoint path string mapping location',
  })
  osDeviceNodePath: string;

  @Expose()
  @ApiProperty({
    example: false,
    description:
      'Flags if the device disk functions strictly as an unassigned hot-spare node backup for instant rebuilding triggers',
  })
  isSpareDrive: boolean;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:51:00.000Z' })
  createdAt: Date;
  @Expose()
  @ApiProperty({ example: '2026-07-13T05:51:00.000Z' })
  updatedAt: Date;

  @Expose()
  @Type(() => LogicalVdevShallowDto)
  @ApiProperty({ type: LogicalVdevShallowDto })
  logicalVdev: LogicalVdevShallowDto;

  @Expose()
  @Type(() => PhysicalDriveShallowDto)
  @ApiProperty({ type: PhysicalDriveShallowDto })
  physicalDrive: PhysicalDriveShallowDto;
}
