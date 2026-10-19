import { Expose, Type } from 'class-transformer';
import { CpuModelResponseDto } from '../../../cpu-model/dto/response/cpu-model-response.dto';
import { VendorResponseDto } from '../../../vendor/dto/response/vendor-response.dto';
import { CurrencyResponseDto } from '../../../currency/dto/response/currency-response.dto';

export class PhysicalCpuResponseDto {
  @Expose()
  id: string;

  @Expose()
  label: string;

  @Expose()
  serialNumber: string;

  @Expose()
  acquisitionCost: number;

  @Expose()
  purchaseDate: string; // Formatted consistently as an 'YYYY-MM-DD' text string

  @Expose()
  warrantyExpiryDate: string;

  @Expose() // Exposes the dynamic VIRTUAL title attribute
  title: string;

  @Expose()
  cpuModelId: string;

  @Expose()
  retailerVendorId: string;

  @Expose()
  currencyId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  displayKey: number;

  // --- Nested Enterprise Lookup Associations ---

  @Expose()
  @Type(() => CpuModelResponseDto)
  cpuModel?: CpuModelResponseDto;

  @Expose()
  @Type(() => VendorResponseDto)
  retailerVendor?: VendorResponseDto;

  @Expose()
  @Type(() => CurrencyResponseDto)
  currency?: CurrencyResponseDto;

  constructor(partial: Partial<PhysicalCpuResponseDto>) {
    Object.assign(this, partial);
  }
}
