import { Expose } from 'class-transformer';

export class PoolTypeResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  managed: boolean;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  displayKey: number;

  constructor(partial: Partial<PoolTypeResponseDto>) {
    Object.assign(this, partial);
  }
}
