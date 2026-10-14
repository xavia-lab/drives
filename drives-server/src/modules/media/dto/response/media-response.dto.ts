import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Define a safe interface signature layout for the incoming Transform parameter context
interface TransformFnParams {
  value: unknown;
  key: string;
  obj: Record<string, unknown>; // Maps the source object to a known indexable dictionary record structure
  type: number;
}

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
  // Fixed: Passed explicit layouts to the callback parameters to destroy the implicit 'any' contexts
  @Transform(({ value, obj }: TransformFnParams): Record<string, unknown> => {
    // Extract safely using type-casting constraints to prevent checking boundary issues
    const sourceMetadata =
      obj.metadata && typeof obj.metadata === 'object'
        ? (obj.metadata as Record<string, unknown>)
        : null;

    const currentMetadata =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : null;

    const hasData = sourceMetadata && Object.keys(sourceMetadata).length > 0;
    const isValueEmpty =
      !currentMetadata || Object.keys(currentMetadata).length === 0;

    if (isValueEmpty && hasData && sourceMetadata) {
      return sourceMetadata;
    }

    return currentMetadata || sourceMetadata || {};
  })
  metadata?: Record<string, unknown>; // Fixed: Changed Record<string, any> over to 'unknown' to lock types completely

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
