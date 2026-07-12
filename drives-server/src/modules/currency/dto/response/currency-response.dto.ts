import { Expose } from 'class-transformer';

export class CurrencyResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  symbol: string;

  @Expose()
  managed: boolean;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  itemNumber: number;

  constructor(partial: Partial<CurrencyResponseDto>) {
    Object.assign(this, partial);
  }
}
