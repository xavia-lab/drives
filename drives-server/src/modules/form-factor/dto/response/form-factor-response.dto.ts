import { Expose } from 'class-transformer';

export class FormFactorResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slotPitch: number;

  @Expose()
  managed: boolean;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<FormFactorResponseDto>) {
    Object.assign(this, partial);
  }
}
