import { Expose } from 'class-transformer';

export class CountryResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  managed: boolean;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<CountryResponseDto>) {
    Object.assign(this, partial);
  }
}
