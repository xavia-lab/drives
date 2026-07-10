import { Expose, Type } from 'class-transformer';
import { VendorResponseDto } from '../../../vendor/dto/response/vendor-response.dto';
import { StorageTypeResponseDto } from '../../../storage-type/dto/response/storage-type-response.dto';
import { FormFactorResponseDto } from '../../../form-factor/dto/response/form-factor-response.dto';
import { InterfaceResponseDto } from '../../../interface/dto/response/interface-response.dto';
import { CapacityResponseDto } from '../../../capacity/dto/response/capacity-response.dto';

export class StorageModelResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  modelNumber: string;

  @Expose() // Maps the VIRTUAL title getter from the entity
  title: string;

  @Expose()
  maxEnduranceTbw: number | null;

  @Expose()
  manufacturerId: number;

  @Expose()
  storageTypeId: number;

  @Expose()
  formFactorId: number;

  @Expose()
  interfaceId: number;

  @Expose()
  capacityId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // --- Nested Associations ---

  @Expose()
  @Type(() => VendorResponseDto)
  manufacturer?: VendorResponseDto;

  @Expose()
  @Type(() => StorageTypeResponseDto)
  storageType?: StorageTypeResponseDto;

  @Expose()
  @Type(() => FormFactorResponseDto)
  formFactor?: FormFactorResponseDto;

  @Expose()
  @Type(() => InterfaceResponseDto)
  interface?: InterfaceResponseDto;

  @Expose()
  @Type(() => CapacityResponseDto)
  capacity?: CapacityResponseDto;

  constructor(partial: Partial<StorageModelResponseDto>) {
    Object.assign(this, partial);
  }
}
