import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OperatingSystemResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'Sequential cross-page display identifier index',
  })
  itemNumber: number;

  @Expose()
  @ApiProperty({
    example: '019f5431-1bf4-73bc-9d1a-5b32e0bc2754',
    description: 'Unique UUIDv7 key',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'Proxmox VE 8.x',
    description: 'Operating system version name string',
  })
  name: string;

  @Expose()
  @ApiPropertyOptional({
    example: 'Proxmox Server Solutions',
    description: 'OS distributor corporate entity',
  })
  vendor: string | null;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  createdAt: Date;
  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  updatedAt: Date;
}
