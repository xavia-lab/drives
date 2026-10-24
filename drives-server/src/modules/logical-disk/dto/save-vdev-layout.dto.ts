import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VdevMemberInputDto } from './attach-vdev-members.dto';

export class VdevLayoutDto {
  @ApiProperty({ description: 'Logical vdev UUIDv7' })
  @IsUUID('7', { message: 'vdevId must be a valid UUIDv7 string' })
  vdevId: string;

  @ApiProperty({ type: [VdevMemberInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VdevMemberInputDto)
  members: VdevMemberInputDto[];
}

export class SaveVdevLayoutDto {
  @ApiProperty({ type: [VdevLayoutDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VdevLayoutDto)
  vdevs: VdevLayoutDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
