import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum QRResourceType {
  PRODUCTS = 'products',
  PURCHASE_ORDERS = 'purchase-orders',
  ALLOCATIONS = 'allocations',
}

export class LookupQrLinkDto {
  @IsEnum(QRResourceType, {
    message:
      'resourceType must be one of: products, purchase-orders, allocations',
  })
  @IsNotEmpty()
  resourceType: QRResourceType;

  @IsString()
  @IsNotEmpty()
  resourceId: string;
}
