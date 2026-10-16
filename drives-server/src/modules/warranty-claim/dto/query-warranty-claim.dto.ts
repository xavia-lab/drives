import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryWarrantyClaimDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, physicalDriveId, triggeringEventId, handledByVendorId, rmaTrackingNumber, claimStatus, notes, submittedAt, resolvedAt, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow high-performance sequential numeric sorting
    'physicalDriveId',
    'triggeringEventId',
    'handledByVendorId',
    'rmaTrackingNumber',
    'claimStatus',
    'notes',
    'submittedAt',
    'resolvedAt',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: '12',
    description:
      'Filterable fields: id, displayKey, physicalDriveId, triggeringEventId, handledByVendorId, rmaTrackingNumber, claimStatus, notes, submittedAt, resolvedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow strict numerical equality filtering from your UI fields
    'physicalDriveId',
    'triggeringEventId',
    'handledByVendorId',
    'rmaTrackingNumber',
    'claimStatus',
    'notes',
    'submittedAt',
    'resolvedAt',
  ])
  declare filterField?: string;
}
