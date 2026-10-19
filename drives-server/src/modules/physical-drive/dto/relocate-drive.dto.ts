import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Payload for the Relocate Drive workflow. Relocation only moves the drive's
// datacenter location; it never mounts/unmounts the drive. Mounted drives are
// rejected so the workflow never creates an inconsistent state.
export class RelocateDriveDto {
  @ApiProperty({
    description: 'The datacenter the drive is moving to.',
    example: '019f6a00-0000-7a02-8a02-000000000002',
    required: true,
  })
  @IsUUID('7', { message: 'The datacenterId must be a valid UUIDv7 string' })
  datacenterId: string;

  @ApiPropertyOptional({
    description:
      'When the drive arrived at the new datacenter. Defaults to now when omitted.',
    example: '2026-10-19T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  locatedAt?: string;

  @ApiPropertyOptional({
    description:
      'Optional operator note (ticket ref, transport details, rack location, ...)',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
