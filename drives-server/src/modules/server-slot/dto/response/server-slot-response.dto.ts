import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ServerShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique identifier of the server',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'us-east-compute-42.infra',
    description: 'Unique hostname key of the server node',
  })
  hostname: string;
}

class InterfaceShallowDto {
  @Expose()
  @ApiProperty({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description: 'The unique identifier of the interface',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'U.3 NVMe',
    description: 'Name of the hardware interface bus connection',
  })
  name: string;
}

export class ServerSlotResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  itemNumber: number;

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
  @ApiPropertyOptional({
    example: '0000:41:00.0',
    description:
      'Operating system kernel storage controllers topology hardware address bus string',
  })
  pcieBusAddress: string | null;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description:
      'Relational link pointer ID connecting to the parent hosting server node',
  })
  serverId: string;

  @Expose()
  @ApiProperty({
    example: '019089f2-23f5-7f9e-8c35-be02bfdf0ca8',
    description:
      'Relational link pointer ID identifying the compatible supported backplane interface layout',
  })
  supportedInterfaceId: string;

  @Expose()
  @ApiProperty({ example: '2026-07-13T04:21:00.000Z' })
  createdAt: Date;
  @Expose()
  @ApiProperty({ example: '2026-07-13T04:21:00.000Z' })
  updatedAt: Date;

  @Expose()
  @Type(() => ServerShallowDto)
  @ApiProperty({ type: ServerShallowDto })
  server: ServerShallowDto;

  @Expose()
  @Type(() => InterfaceShallowDto)
  @ApiProperty({ type: InterfaceShallowDto })
  supportedInterface: InterfaceShallowDto;
}
