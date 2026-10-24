import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VdevMemberRole } from '../entities/logical-disk.entity';

export class MoveVdevMemberDto {
  @ApiProperty({ description: 'Physical drive UUIDv7' })
  @IsUUID('7', { message: 'physicalDriveId must be a valid UUIDv7 string' })
  physicalDriveId: string;

  @ApiProperty({ description: 'Target logical vdev UUIDv7' })
  @IsUUID('7', { message: 'targetVdevId must be a valid UUIDv7 string' })
  targetVdevId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 32)
  osDeviceNodePath?: string | null;

  @ApiPropertyOptional({ enum: VdevMemberRole })
  @IsOptional()
  @IsEnum(VdevMemberRole)
  memberRole?: VdevMemberRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  memberIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  groupIndex?: number;
}

export class MoveVdevMembersDto {
  @ApiProperty({ type: [MoveVdevMemberDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MoveVdevMemberDto)
  moves: MoveVdevMemberDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
