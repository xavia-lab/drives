import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogDeltaPayloadDto {
  @ApiPropertyOptional({
    description:
      'The complete snapshot state of the record properties BEFORE the modification took place',
    example: { hostname: 'us-east-compute-41.infra', hostOs: 'Ubuntu Server' },
    // type: 'object',
    nullable: true,
  })
  previous?: Record<string, any> | null;

  @ApiPropertyOptional({
    description:
      'The updated state of the record properties AFTER the modification was committed',
    example: { hostname: 'us-east-compute-41.infra', hostOs: 'Proxmox VE' },
    // type: 'object',
    nullable: true,
  })
  current?: Record<string, any> | null;
}

export class AuditLogResponseDto {
  @ApiProperty({
    description: 'The sequential primary index configuration key',
    example: 7421,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description:
      'The specific structural event method keyword parsed natively by Refine.dev',
    example: 'update',
  })
  @Expose()
  action: string; // 'create' | 'update' | 'delete'

  @ApiProperty({
    description:
      'The targeted domain model name or entity collection slug identifier',
    example: 'servers',
  })
  @Expose()
  resource: string;

  @ApiProperty({
    description:
      'The targeted record primary key value (held as string to support both numeric hardware keys and Keycloak UUIDs)',
    example: '42',
  })
  @Expose()
  resourceId: string;

  @ApiProperty({
    description:
      'Structured database object tracking property value modifications',
    type: AuditLogDeltaPayloadDto,
    nullable: true,
  })
  @Expose()
  @Type(() => AuditLogDeltaPayloadDto)
  payload: AuditLogDeltaPayloadDto | null;

  @ApiProperty({
    description:
      'The absolute execution timestamp when the security action occurred',
  })
  @Expose()
  timestamp: Date;

  @ApiProperty({ description: 'The database record initialization timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'The last database modification update timestamp',
  })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description:
      'The federated Keycloak sub user token account reference UUID string (null if recorded by automated system crons)',
    example: 'c3b073b4-d112-4217-9154-159d3df398ee',
    nullable: true,
  })
  @Expose()
  userId: string | null;

  constructor(partial: Partial<AuditLogResponseDto>) {
    Object.assign(this, partial);
  }
}
