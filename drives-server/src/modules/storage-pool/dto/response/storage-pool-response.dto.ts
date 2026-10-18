import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class HostShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique identifier of the host (physical or virtual)',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'us-east-compute-42.infra',
    description: 'The unique hostname of the host',
  })
  hostname: string;
}

export class CurrentStoragePoolHostDto {
  @Expose()
  @ApiProperty({ enum: ['PHYSICAL', 'VIRTUAL'] })
  type: 'PHYSICAL' | 'VIRTUAL';

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The id of the currently attached host',
  })
  serverId: string;

  @Expose()
  @ApiProperty({ example: 'us-east-compute-42.infra' })
  hostname: string;
}

export class StoragePoolHostEventResponseDto {
  @Expose()
  @ApiProperty({ example: '019f5431-1bf4-7e4b-accd-617e39d8a372' })
  id: string;

  @Expose()
  @ApiProperty({ example: 1 })
  displayKey: number;

  @Expose()
  @ApiProperty({ enum: ['IMPORT', 'EXPORT'] })
  eventType: string;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  eventTimestamp: Date;

  @Expose()
  @ApiPropertyOptional()
  notes: string | null;

  @Expose()
  @ApiPropertyOptional()
  physicalServerId: string | null;

  @Expose()
  @ApiPropertyOptional()
  virtualServerId: string | null;

  @Expose()
  @Type(() => HostShallowDto)
  @ApiPropertyOptional({ type: HostShallowDto })
  physicalServer: HostShallowDto | null;

  @Expose()
  @Type(() => HostShallowDto)
  @ApiPropertyOptional({ type: HostShallowDto })
  virtualServer: HostShallowDto | null;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  createdAt: Date;
}

export class StoragePoolResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  displayKey: number;

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
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    description:
      'Relational link pointer ID referencing the storage pool type lookup record',
  })
  poolTypeId: string;

  @Expose()
  @ApiProperty({
    example: true,
    description:
      'Indicates if underlying raw computing storage volumes block layers utilize crypto security parameters',
  })
  encryptionEnabled: boolean;

  @Expose()
  @Type(() => CurrentStoragePoolHostDto)
  @ApiPropertyOptional({
    type: CurrentStoragePoolHostDto,
    description:
      'The host the pool is currently attached to, derived from the latest IMPORT/EXPORT event. Null when detached.',
  })
  currentHost: CurrentStoragePoolHostDto | null;

  @Expose()
  @Type(() => StoragePoolHostEventResponseDto)
  @ApiPropertyOptional({
    type: StoragePoolHostEventResponseDto,
    isArray: true,
    description:
      'Ascending IMPORT/EXPORT event history for this pool (present on single-record reads).',
  })
  hosts: StoragePoolHostEventResponseDto[];

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  createdAt: Date;
  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  updatedAt: Date;
}
