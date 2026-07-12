import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoragePoolType } from '../../entities/storage-pool.entity';

class ServerShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique identifier of the hosting physical server',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'us-east-compute-42.infra',
    description: 'The unique hostname of the physical node',
  })
  hostname: string;
}

class VirtualServerShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    description: 'The unique identifier of the guest virtual server',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'truenas-core.local',
    description: 'The unique hostname of the guest virtual machine',
  })
  hostname: string;
}

export class StoragePoolResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  itemNumber: number;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    description:
      'The unique UUIDv7 primary identifier of this storage pool record',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'tank-nvme-cache',
    description:
      'The descriptive namespace label identifier of the storage pool array',
  })
  poolName: string;

  @Expose()
  @ApiProperty({
    enum: StoragePoolType,
    example: StoragePoolType.ZFS,
    description:
      'The logical system volume format topology architecture design standard type',
  })
  poolType: StoragePoolType;

  @Expose()
  @ApiProperty({
    example: true,
    description:
      'Indicates if underlying raw computing storage volumes block layers utilize crypto security parameters',
  })
  encryptionEnabled: boolean;

  @Expose()
  @ApiPropertyOptional({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description:
      'Relational link pointer ID connecting to the baremetal server host node if mapped physical',
  })
  serverId: string | null;

  @Expose()
  @ApiPropertyOptional({
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
    description:
      'Relational link pointer ID connecting to the virtualized hypervisor server node guest if mapped logical',
  })
  virtualServerId: string | null;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  createdAt: Date;
  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  updatedAt: Date;

  @Expose()
  @Type(() => ServerShallowDto)
  @ApiPropertyOptional({ type: ServerShallowDto })
  server: ServerShallowDto | null;

  @Expose()
  @Type(() => VirtualServerShallowDto)
  @ApiPropertyOptional({ type: VirtualServerShallowDto })
  virtualServer: VirtualServerShallowDto | null;
}
