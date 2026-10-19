import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePhysicalDriveDto } from './create-physical-drive.dto';

// Payload for the drive-acquisition workflow: everything needed to create the
// physical drive, record its initial location and append the ACQUIRE lifecycle
// event in a single transaction.
export class CreateDriveAcquisitionDto extends CreatePhysicalDriveDto {
  @ApiProperty({
    description:
      'The datacenter the acquired drive is received into (initial location event).',
    example: '019f6a00-0000-7a01-8a01-000000000001',
    required: true,
  })
  @IsUUID('7', { message: 'The datacenterId must be a valid UUIDv7 string' })
  datacenterId: string;

  @ApiPropertyOptional({
    description:
      'Optional operator note for the initial location (ticket ref, rack location, ...)',
  })
  @IsOptional()
  @IsString()
  locationNotes?: string;

  @ApiPropertyOptional({
    description:
      'When the drive arrived at the datacenter. Defaults to now when omitted.',
    example: '2026-07-13T05:31:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  locatedAt?: string;
}
