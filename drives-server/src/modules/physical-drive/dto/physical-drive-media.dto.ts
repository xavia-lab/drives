import { plainToInstance, Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhysicalDriveMediaType } from '../entities/physical-drive-media.entity';

export class PhysicalDriveMediaUploadItemDto {
  @ApiPropertyOptional({ enum: PhysicalDriveMediaType })
  @IsOptional()
  @IsEnum(PhysicalDriveMediaType)
  attachmentType?: PhysicalDriveMediaType;

  @ApiPropertyOptional({ example: 'Front label photo' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

const parseAttachments = (
  value: unknown,
): PhysicalDriveMediaUploadItemDto[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;

  let entries: unknown = value;
  if (typeof value === 'string') {
    try {
      entries = JSON.parse(value);
    } catch {
      return [
        plainToInstance(PhysicalDriveMediaUploadItemDto, {
          attachmentType: 'INVALID',
        }),
      ];
    }
  }

  if (!Array.isArray(entries)) {
    entries = [entries];
  }

  return (entries as unknown[]).map((entry) =>
    typeof entry === 'object' && entry !== null
      ? plainToInstance(PhysicalDriveMediaUploadItemDto, entry)
      : plainToInstance(PhysicalDriveMediaUploadItemDto, {
          attachmentType: 'INVALID',
        }),
  );
};

export class UploadPhysicalDriveMediaDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'JSON array aligned with the uploaded files: [{ attachmentType, notes, isPrimary, sortOrder }]',
  })
  @IsOptional()
  @Transform(({ value }) => parseAttachments(value))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhysicalDriveMediaUploadItemDto)
  attachments?: PhysicalDriveMediaUploadItemDto[];
}

export class PhysicalDriveMediaUpdateItemDto extends PhysicalDriveMediaUploadItemDto {
  @ApiProperty({
    description: 'UUIDv7 of the attachment to update',
  })
  @IsUUID('7', { message: 'attachmentId must be a valid UUIDv7 string' })
  attachmentId: string;
}

const parseUpdates = (
  value: unknown,
): PhysicalDriveMediaUpdateItemDto[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;

  let entries: unknown = value;
  if (typeof value === 'string') {
    try {
      entries = JSON.parse(value);
    } catch {
      return [plainToInstance(PhysicalDriveMediaUpdateItemDto, {})];
    }
  }

  if (!Array.isArray(entries)) entries = [entries];

  return (entries as unknown[]).map((entry) =>
    typeof entry === 'object' && entry !== null
      ? plainToInstance(PhysicalDriveMediaUpdateItemDto, entry)
      : plainToInstance(PhysicalDriveMediaUpdateItemDto, {}),
  );
};

const parseRemove = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;

  let entries: unknown = value;
  if (typeof value === 'string') {
    try {
      entries = JSON.parse(value);
    } catch {
      return ['invalid'];
    }
  }

  if (!Array.isArray(entries)) entries = [entries];
  return (entries as unknown[]).filter(
    (entry): entry is string => typeof entry === 'string',
  );
};

export class ManagePhysicalDriveMediaDto {
  @ApiPropertyOptional({
    type: String,
    description: 'JSON array of metadata for the new files',
  })
  @IsOptional()
  @Transform(({ value }) => parseAttachments(value))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhysicalDriveMediaUploadItemDto)
  add?: PhysicalDriveMediaUploadItemDto[];

  @ApiPropertyOptional({
    type: String,
    description: 'JSON array of attachment updates',
  })
  @IsOptional()
  @Transform(({ value }) => parseUpdates(value))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhysicalDriveMediaUpdateItemDto)
  update?: PhysicalDriveMediaUpdateItemDto[];

  @ApiPropertyOptional({
    type: String,
    description: 'JSON array of attachment ids to remove',
  })
  @IsOptional()
  @Transform(({ value }) => parseRemove(value))
  @IsArray()
  @IsUUID('7', { each: true, message: 'remove must contain UUIDv7 ids' })
  remove?: string[];
}
