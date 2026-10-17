import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhysicalServerSlotResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  displayKey: number;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-74cf-8da9-6c3905bb4e2d',
    description: 'The unique UUIDv7 primary identifier of this server slot',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'Bay 0',
    description:
      'The physical text label printed on the server case faceplate chassis',
  })
  slotLabel: string;

  @Expose()
  @ApiProperty({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description:
      'Relational link pointer ID identifying the compatible supported backplane interface layout',
  })
  supportedInterfaceId: string;

  @Expose()
  @ApiPropertyOptional({
    example: '0000:41:00.0',
    description:
      'Operating system kernel storage controllers topology hardware address bus string',
  })
  pcieBusAddress: string | null;

  @Expose()
  @ApiProperty({ example: '2026-07-13T04:21:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-13T04:21:00.000Z' })
  updatedAt: Date;
}

export class PhysicalServerResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  displayKey: number;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique UUIDv7 primary identifier of this server record',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'us-east-compute-42.infra',
    description: 'Unique fully qualified domain name or hostname of the server',
  })
  hostname: string;

  @Expose()
  @ApiProperty({
    example: 512,
    description:
      'Volatile RAM capacity value expressed in the selected memory unit',
  })
  memoryValue: number;

  @Expose()
  @ApiProperty({
    example: 'GiB',
    description:
      'Binary memory unit token used to scale the memory value into bytes',
  })
  memoryUnit: string;

  @Expose()
  @ApiProperty({
    example: 549755813888,
    description:
      'Denormalised memory capacity converted into whole bytes for server-side sorting and range filtering',
  })
  absoluteMemory: number;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description:
      'The matching relational identifier linking the system to its CPU specifications',
  })
  cpuModelId: string;

  @Expose()
  @ApiProperty({
    example: 2,
    description:
      'Total active processor sockets currently loaded on the motherboard backplane tray',
  })
  cpuCount: number;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-73bc-9d1a-5b32e0bc2754',
    description: 'The normalized operating system look up ID',
  })
  operatingSystemId: string;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-72fd-a9c0-5a396eb14ea1',
    description: 'The structural Rack cabinet lookup reference ID link mapping',
  })
  rackId: string;

  @Expose()
  @ApiProperty({
    example: 22,
    description:
      'The absolute bottom Rack Unit elevation index position occupied by the chassis frame',
  })
  rackUnitPosition: number;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  updatedAt: Date;

  @Expose()
  @Type(() => PhysicalServerSlotResponseDto)
  @ApiProperty({
    type: [PhysicalServerSlotResponseDto],
    description:
      'Backplane storage slots owned by and eagerly loaded with this server',
  })
  slots: PhysicalServerSlotResponseDto[];
}
