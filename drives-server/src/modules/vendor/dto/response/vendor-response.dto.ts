import { Expose, Type } from 'class-transformer';
import { CountryResponseDto } from '../../../country/dto/response/country-response.dto';

export class VendorResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose() // Maps the VIRTUAL title getter from the entity
  title: string;

  @Expose()
  isManufacturer: boolean;

  @Expose()
  isRetailer: boolean;

  @Expose()
  supportContactEmail: string | null;

  @Expose()
  portalUrl: string | null;

  @Expose()
  managed: boolean;

  @Expose()
  countryId: number; // Updated to match the numerical identifier change

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // --- Nested Associations ---
  @Expose()
  @Type(() => CountryResponseDto)
  country?: CountryResponseDto;

  constructor(partial: Partial<VendorResponseDto>) {
    Object.assign(this, partial);
  }
}
