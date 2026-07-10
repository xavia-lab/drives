import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsObject,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAuditLogDeltaPayloadDto {
  @ApiPropertyOptional({
    description:
      'The complete snapshot state of the record properties BEFORE the modification took place',
    example: { hostname: 'us-east-compute-41.infra', hostOs: 'Ubuntu Server' },
    // type: 'object',
  })
  @IsOptional()
  @IsObject()
  previous?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'The updated state of the record properties AFTER the modification was committed',
    example: { hostname: 'us-east-compute-41.infra', hostOs: 'Proxmox VE' },
    // type: 'object',
  })
  @IsOptional()
  @IsObject()
  current?: Record<string, any>;
}

export class CreateAuditLogDto {
  @ApiProperty({
    description:
      'The specific structural event method keyword parsed natively by Refine.dev',
    enum: ['create', 'update', 'delete'],
    example: 'update',
    required: true,
  })
  @IsNotEmpty()
  @IsIn(['create', 'update', 'delete'])
  action: string;

  @ApiProperty({
    description:
      'The targeted domain model name or entity collection slug identifier matching Refine resource tags',
    example: 'servers',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 64)
  resource: string;

  @ApiProperty({
    description:
      'The targeted record primary key value (held as string to support both numeric hardware keys and Keycloak UUIDs)',
    example: '42',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 64)
  resourceId: string;

  @ApiPropertyOptional({
    description:
      'Structured database object tracking property value modifications',
    type: CreateAuditLogDeltaPayloadDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAuditLogDeltaPayloadDto)
  payload?: CreateAuditLogDeltaPayloadDto;

  @ApiPropertyOptional({
    description:
      'The federated Keycloak sub user token account reference UUID string (null if recorded by automated system crons)',
    example: 'c3b073b4-d112-4217-9154-159d3df398ee',
    required: false,
  })
  @IsOptional()
  @IsUUID('4') // Enforces strict Keycloak UUID format integrity
  userId?: string;
}
