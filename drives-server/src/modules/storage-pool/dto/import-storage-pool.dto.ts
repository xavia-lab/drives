import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportStoragePoolDto {
  @ApiPropertyOptional({
    description:
      'Physical host to attach the pool to. Exactly one of serverId/virtualServerId must be provided.',
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The serverId must be a valid UUIDv7 string' })
  serverId?: string;

  @ApiPropertyOptional({
    description:
      'Virtualized guest to attach the pool to. Exactly one of serverId/virtualServerId must be provided.',
    example: '019f5431-1bf4-76eb-a5f3-1823ab04cf3f',
  })
  @IsOptional()
  @IsUUID('7', { message: 'The virtualServerId must be a valid UUIDv7 string' })
  virtualServerId?: string;

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
