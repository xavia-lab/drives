import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePhysicalDriveLocationDto {
  @ApiProperty({
    description:
      'The datacenter the drive is being assigned to. Recording a new datacenter appends a new location event (a move).',
    example: '019f6a00-0000-7a01-8a01-000000000001',
    required: true,
  })
  @IsUUID('7', { message: 'The datacenterId must be a valid UUIDv7 string' })
  datacenterId: string;

  @ApiPropertyOptional({
    description:
      'Optional operator note (ticket ref, transport details, rack location, ...)',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'When the drive arrived at the datacenter. Defaults to now when omitted (used to backfill history).',
    example: '2026-07-13T05:31:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  locatedAt?: string;
}
