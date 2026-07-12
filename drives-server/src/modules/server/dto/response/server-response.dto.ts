import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CpuModelShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique identifier of the CPU model',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'EPYC 7763',
    description: 'Market name identifier of the CPU',
  })
  name: string;

  @Expose()
  @ApiProperty({
    example: 'AMD',
    description: 'The manufacturer vendor of the CPU chip architecture',
  })
  vendor: string;
}

class OperatingSystemShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-73bc-9d1a-5b32e0bc2754',
    description: 'The unique identifier of the Operating System',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'Proxmox VE 8.x',
    description: 'The display name profile of the OS',
  })
  name: string;
}

class RackShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-72fd-a9c0-5a396eb14ea1',
    description: 'The unique identifier of the Rack asset cabinet',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'RACK-B12',
    description:
      'Alphanumeric hardware cabinet tracking designation code string',
  })
  name: string;
}

export class ServerResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  itemNumber: number;

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
    example: 524288,
    description:
      'Total operational volatile RAM memory available on the node measured in Megabytes',
  })
  totalRamMb: number;

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
  @Type(() => CpuModelShallowDto)
  @ApiProperty({ type: CpuModelShallowDto })
  cpuModel: CpuModelShallowDto;

  @Expose()
  @Type(() => OperatingSystemShallowDto)
  @ApiProperty({ type: OperatingSystemShallowDto })
  operatingSystem: OperatingSystemShallowDto;

  @Expose()
  @Type(() => RackShallowDto)
  @ApiProperty({ type: RackShallowDto })
  rack: RackShallowDto;
}
