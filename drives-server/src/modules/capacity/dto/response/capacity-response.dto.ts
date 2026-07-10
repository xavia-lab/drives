import { Expose } from 'class-transformer';

export class CapacityResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  unit: string;

  @Expose()
  absoluteCapacity: number;

  @Expose()
  managed: boolean;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<CapacityResponseDto>) {
    Object.assign(this, partial);
  }
}
