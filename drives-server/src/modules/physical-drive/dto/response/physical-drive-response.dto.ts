import { Expose, Type } from 'class-transformer';
import { StorageModelResponseDto } from '../../../storage-model/dto/response/storage-model-response.dto';
import { VendorResponseDto } from '../../../vendor/dto/response/vendor-response.dto';
import { CurrencyResponseDto } from '../../../currency/dto/response/currency-response.dto';

export class PhysicalDriveResponseDto {
  @Expose()
  id: string; // Updated to number to align with your migration sequence layout

  @Expose()
  label: string;

  @Expose()
  serialNumber: string;

  @Expose()
  worldwideNameWwn: string | null;

  @Expose()
  acquisitionCost: number;

  @Expose()
  purchaseDate: string; // Formatted consistently as an 'YYYY-MM-DD' text string

  @Expose()
  warrantyExpiryDate: string;

  @Expose() // Exposes the dynamic VIRTUAL title attribute
  title: string;

  @Expose()
  storageModelId: string;

  @Expose()
  retailerVendorId: string;

  @Expose()
  currencyId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // --- Nested Enterprise Lookup Associations ---

  @Expose()
  @Type(() => StorageModelResponseDto)
  storageModel?: StorageModelResponseDto;

  @Expose()
  @Type(() => VendorResponseDto)
  retailerVendor?: VendorResponseDto;

  @Expose()
  @Type(() => CurrencyResponseDto)
  currency?: CurrencyResponseDto;

  constructor(partial: Partial<PhysicalDriveResponseDto>) {
    Object.assign(this, partial);
  }
}
