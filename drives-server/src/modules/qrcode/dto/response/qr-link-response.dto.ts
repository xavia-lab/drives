import { Expose } from 'class-transformer';

export class QrLinkResponseDto {
  @Expose()
  shortId: string;

  @Expose()
  resourceType: string;

  @Expose()
  resourceId: string;

  @Expose()
  targetUri: string;

  @Expose()
  sourceUrl: string;

  constructor(partial: Partial<QrLinkResponseDto>) {
    Object.assign(this, partial);
  }
}
