import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Nested passthrough-slot payload carried inside the virtual server
 * create/update body. Each entry maps one of the host physical server's
 * backplane slots into the guest. Replaces the full set on update.
 */
export class PassthroughSlotDto {
  @ApiPropertyOptional({
    example: '019f5431-1bf4-74cf-8da9-6c3905bb4e2d',
    description: 'Optional client-side generated UUIDv7 identifier',
    type: String,
  })
  @IsOptional()
  @IsUUID('7', { message: 'The id must be a valid UUIDv7 string' })
  id?: string;

  @ApiProperty({
    description:
      'Relational link pointer ID identifying the host physical server slot passed through to the guest',
    example: '019f6a00-0000-7e00-8e00-000000000001',
    required: true,
  })
  @IsUUID('7', {
    message: 'The serverSlotId must be a valid UUIDv7 string',
  })
  @IsNotEmpty()
  serverSlotId: string;
}
