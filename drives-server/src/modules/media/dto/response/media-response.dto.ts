import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'cc493aa94da119a37208c618875ca25510434a3b7ee27ff22edc1a7f125559ca',
  })
  @Expose()
  fileId: string;

  @ApiProperty({
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'CERTIFICATE', 'QR_CODE', 'LABEL'],
    example: 'IMAGE',
  })
  @Expose()
  mediaType: string;

  @ApiProperty({ example: 'gold-ring.jpg' })
  @Expose()
  fileName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @Expose()
  mimeType: string;

  @Expose()
  fileSize: number;

  @ApiPropertyOptional({
    example: {
      width: 1200,
      height: 800,
      alt: 'Gold Ring Image',
      caption: '22K Gold Ring',
    },
  })
  @Expose()
  @Transform(({ value, obj }) => {
    // Check if the current value is empty and the source object has data
    const hasData = obj.metadata && Object.keys(obj.metadata).length > 0;
    const isValueEmpty = !value || Object.keys(value).length === 0;

    if (isValueEmpty && hasData) {
      return obj.metadata;
    }

    return value || obj.metadata || {};
  })
  metadata?: Record<string, any>;

  @Expose()
  createdAt: Date;

  @Expose()
  deletedAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  isPrimary: boolean;

  @Expose()
  isActive: boolean;

  @Expose()
  sortOrder: number;
}
