import { Expose } from 'class-transformer';

export class StorageTypeResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  wearTrackable: boolean;

  @Expose()
  managed: boolean;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<StorageTypeResponseDto>) {
    Object.assign(this, partial);
  }
}
