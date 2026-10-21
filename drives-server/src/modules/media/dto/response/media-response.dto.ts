import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '../../entities/media.entity';

export class MediaResponseDto {
  @ApiProperty({
    example: '019f6a90-0000-7d00-8d00-000000000001',
  })
  @Expose()
  id: string;

  @ApiProperty({ example: 1 })
  @Expose()
  displayKey: number;

  @ApiProperty({
    example: 'cc493aa94da119a37208c618875ca25510434a3b7ee27ff22edc1a7f125559ca',
  })
  @Expose()
  fileId: string;

  @ApiProperty({
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  @Expose()
  mediaType: MediaType;

  @ApiPropertyOptional({ example: 'gold-ring.jpg' })
  @Expose()
  fileName: string | null;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @Expose()
  mimeType: string | null;

  @Expose()
  fileSize: number | null;

  @ApiPropertyOptional({
    example: {
      width: 1200,
      height: 800,
      alt: 'Gold Ring Image',
      caption: '22K Gold Ring',
    },
  })
  @Expose()
  metadata: Record<string, unknown> | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  deletedAt: Date | null;
}
