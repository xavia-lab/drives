import { Expose, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DriveModelResponseDto } from '../../../drive-model/dto/response/drive-model-response.dto';
import { VendorResponseDto } from '../../../vendor/dto/response/vendor-response.dto';
import { CurrencyResponseDto } from '../../../currency/dto/response/currency-response.dto';
import {
  CurrentPhysicalDriveLocationDto,
  PhysicalDriveLocationResponseDto,
} from './physical-drive-location-response.dto';

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
  driveModelId: string;

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
  @Type(() => DriveModelResponseDto)
  driveModel?: DriveModelResponseDto;

  @Expose()
  @Type(() => VendorResponseDto)
  retailerVendor?: VendorResponseDto;

  @Expose()
  @Type(() => CurrencyResponseDto)
  currency?: CurrencyResponseDto;

  @Expose()
  @Type(() => CurrentPhysicalDriveLocationDto)
  @ApiPropertyOptional({
    type: CurrentPhysicalDriveLocationDto,
    description:
      'The datacenter the drive currently sits in, derived from the latest location event. Null when the drive has never been located.',
  })
  currentLocation?: CurrentPhysicalDriveLocationDto | null;

  @Expose()
  @Type(() => PhysicalDriveLocationResponseDto)
  @ApiPropertyOptional({
    type: PhysicalDriveLocationResponseDto,
    isArray: true,
    description:
      'Ascending location history for this drive (present on single-record reads).',
  })
  locations?: PhysicalDriveLocationResponseDto[];

  constructor(partial: Partial<PhysicalDriveResponseDto>) {
    Object.assign(this, partial);
  }
}
