import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VdevMemberRole } from '../entities/logical-disk.entity';

export class VdevMemberInputDto {
  @ApiProperty({ description: 'Physical drive UUIDv7' })
  @IsUUID('7', { message: 'physicalDriveId must be a valid UUIDv7 string' })
  physicalDriveId: string;

  @ApiPropertyOptional({
    description: 'Host-specific device path, e.g. /dev/sda',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  osDeviceNodePath?: string | null;

  @ApiPropertyOptional({ enum: VdevMemberRole, default: VdevMemberRole.DATA })
  @IsOptional()
  @IsEnum(VdevMemberRole)
  memberRole?: VdevMemberRole;
}

export class AttachVdevMembersDto {
  @ApiProperty({ type: [VdevMemberInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VdevMemberInputDto)
  members: VdevMemberInputDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
