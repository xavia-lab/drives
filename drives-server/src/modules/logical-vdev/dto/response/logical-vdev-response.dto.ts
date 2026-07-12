import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VdevRedundancyProfile } from '../../entities/logical-vdev.entity';

class StoragePoolShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    description: 'The unique identifier of the parent storage pool',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'tank-nvme-cache',
    description: 'The descriptive name label of the storage pool array',
  })
  poolName: string;
}

export class LogicalVdevResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  itemNumber: number;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    description:
      'The unique UUIDv7 primary identifier of this logical vdev record',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    description:
      'Relational link pointer ID connecting to the parent hosting storage pool framework',
  })
  storagePoolId: string;

  @Expose()
  @ApiProperty({
    example: 'raidz2-0',
    description:
      'The explicit name identifier assigned to the vdev redundancy grouping inside the pool',
  })
  vdevName: string;

  @Expose()
  @ApiProperty({
    enum: VdevRedundancyProfile,
    example: VdevRedundancyProfile.RAIDZ2,
    description:
      'The data redundancy array profile used to govern disk storage parity rules',
  })
  vdevRedundancyProfile: VdevRedundancyProfile;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:42:00.000Z' })
  createdAt: Date;
  @Expose()
  @ApiProperty({ example: '2026-07-13T05:42:00.000Z' })
  updatedAt: Date;

  @Expose()
  @Type(() => StoragePoolShallowDto)
  @ApiProperty({ type: StoragePoolShallowDto })
  storagePool: StoragePoolShallowDto;
}
