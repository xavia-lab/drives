import { Expose, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MediaResponseDto } from '../../../media/dto/response/media-response.dto';
import { PhysicalDriveMediaType } from '../../entities/physical-drive-media.entity';

export class PhysicalDriveMediaResponseDto {
  @Expose()
  id: string;

  @Expose()
  displayKey: number;

  @Expose()
  physicalDriveId: string;

  @Expose()
  mediaId: string;

  @Expose()
  attachmentType: PhysicalDriveMediaType;

  @Expose()
  isPrimary: boolean;

  @Expose()
  sortOrder: number;

  @Expose()
  notes: string | null;

  @ApiPropertyOptional({ type: MediaResponseDto })
  @Expose()
  @Type(() => MediaResponseDto)
  media?: MediaResponseDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
