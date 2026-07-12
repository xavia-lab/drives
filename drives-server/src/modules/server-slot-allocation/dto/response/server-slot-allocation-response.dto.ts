import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ServerSlotActionType } from '../../entities/server-slot-allocation.entity';

class ServerSlotShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-74cf-8da9-6c3905bb4e2d',
    description: 'The unique identifier of the server slot',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'Bay 0',
    description: 'The physical text label of the chassis slot',
  })
  slotLabel: string;
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
    description: 'The hardware serial number of the drive',
  })
  serialNumber: string;
}

class UserShallowDto {
  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    description: 'The Keycloak UUID of the operator technician',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'admin_tech_01',
    description: 'The username profile of the technician',
  })
  username: string;
}

export class ServerSlotAllocationResponseDto {
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
      'The unique UUIDv7 primary identifier of this allocation ledger record',
  })
  id: string;

  @Expose()
  @ApiProperty({
    enum: ServerSlotActionType,
    example: ServerSlotActionType.MOUNT,
    description: 'The append-only operation action type flag execution state',
  })
  actionType: ServerSlotActionType;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-74cf-8da9-6c3905bb4e2d',
    description:
      'Relational link pointer ID connecting to the parent server slot footprint',
  })
  serverSlotId: string;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e31',
    description:
      'Relational link pointer ID connecting to the physical drive block asset',
  })
  physicalDriveId: string;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-7e4b-accd-617e39d8a372',
    description:
      'Relational link pointer ID identifying the executing Keycloak user',
  })
  userId: string;

  @Expose()
  @ApiProperty({
    example: '2026-07-13T05:01:22.000Z',
    description: 'The explicit datetime ledger entry timestamp marker',
  })
  timestamp: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:01:22.000Z' })
  createdAt: Date;
  @Expose()
  @ApiProperty({ example: '2026-07-13T05:01:22.000Z' })
  updatedAt: Date;

  @Expose()
  @Type(() => ServerSlotShallowDto)
  @ApiProperty({ type: ServerSlotShallowDto })
  serverSlot: ServerSlotShallowDto;

  @Expose()
  @Type(() => PhysicalDriveShallowDto)
  @ApiProperty({ type: PhysicalDriveShallowDto })
  physicalDrive: PhysicalDriveShallowDto;

  @Expose()
  @Type(() => UserShallowDto)
  @ApiProperty({ type: UserShallowDto })
  user: UserShallowDto;
}
