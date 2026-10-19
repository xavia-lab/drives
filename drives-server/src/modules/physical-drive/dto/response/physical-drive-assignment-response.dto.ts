import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CurrentPhysicalDriveAssignmentDto {
  @Expose()
  @ApiProperty({ example: '019f6a70-0000-7e71-8e71-000000000001' })
  allocationId: string;

  @Expose()
  @ApiProperty({ example: '019f6a00-0000-7d31-8d31-000000000031' })
  slotId: string;

  @Expose()
  @ApiProperty({ example: 'Bay 0' })
  slotLabel: string;

  @Expose()
  @ApiProperty({ example: '019f6a00-0000-7d11-8d11-000000000051' })
  serverId: string;

  @Expose()
  @ApiProperty({ example: 'ash-compute-01' })
  serverHostname: string;

  @Expose()
  @ApiProperty({ example: '2026-07-13T05:31:00.000Z' })
  assignedAt: Date;
}
