import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportStoragePoolDto {
  @ApiPropertyOptional({
    description: 'Optional operator note (ticket ref, transport details, ...)',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'When the event occurred. Defaults to now when omitted (used to backfill history).',
    example: '2026-07-13T05:31:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  eventTimestamp?: string;
}
