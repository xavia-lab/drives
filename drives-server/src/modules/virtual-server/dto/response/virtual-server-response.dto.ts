import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VirtualServerType } from '../../entities/virtual-server.entity';

class HostServerShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique identifier of the hosting physical server',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'us-east-compute-42.infra',
    description: 'The unique hostname of the hypervisor host node',
  })
  hostname: string;
}

class OperatingSystemShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-73bc-9d1a-5b32e0bc2754',
    description: 'The unique identifier of the guest operating system',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'Ubuntu Server 24.04 LTS',
    description: 'The display name profile of the guest OS',
  })
  name: string;
}

export class VirtualServerResponseDto {
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
      'The unique UUIDv7 primary identifier of this virtual server record',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description:
      'Relational link pointer ID connecting to the parent hypervisor hosting server node',
  })
  hostServerId: string;

  @Expose()
  @ApiPropertyOptional({
    example: 101,
    description:
      'The native hypervisor cluster VMID numerical layout identifier asset tracker key',
  })
  vmid: number | null;

  @Expose()
  @ApiProperty({
    example: 'truenas-core.local',
    description:
      'Unique fully qualified domain name or hostname of the virtual target machine',
  })
  hostname: string;

  @Expose()
  @ApiProperty({
    enum: VirtualServerType,
    example: VirtualServerType.VM,
    description:
      'The computational virtualization execution structure method flag',
  })
  type: VirtualServerType;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-73bc-9d1a-5b32e0bc2754',
    description:
      'Relational link pointer ID matching the normalized guest operating system definition',
  })
  operatingSystemId: string;

  @Expose()
  @ApiProperty({
    example: 4,
    description:
      'Total number of discrete processing virtual processor cores provisioned onto the layer',
  })
  allocatedVcpus: number;

  @Expose()
  @ApiProperty({
    example: 8192,
    description:
      'Total RAM memory ceiling limitation capacity provisioned rated in Megabytes',
  })
  allocatedRamMb: number;

  @Expose()
  @ApiProperty({
    example: true,
    description: 'Active deployment state indicator flag tracker parameter',
  })
  isActive: boolean;

  @Expose()
  @ApiPropertyOptional({
    example:
      'Main file storage node containing clustered block volume allocations.',
    description:
      'Descriptive troubleshooting infrastructure logs or technician comment notes',
  })
  notes: string | null;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:22:00.000Z' })
  createdAt: Date;
  @Expose()
  @ApiProperty({ example: '2026-07-13T05:22:00.000Z' })
  updatedAt: Date;

  @Expose()
  @Type(() => HostServerShallowDto)
  @ApiProperty({ type: HostServerShallowDto })
  hostServer: HostServerShallowDto;

  @Expose()
  @Type(() => OperatingSystemShallowDto)
  @ApiProperty({ type: OperatingSystemShallowDto })
  operatingSystem: OperatingSystemShallowDto;
}
