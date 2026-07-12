import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryWarrantyClaimDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'claimStatus',
    description:
      'Sortable fields: id, physicalDriveId, triggeringEventId, handledByVendorId, rmaTrackingNumber, claimStatus, notes, submittedAt, resolvedAt, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
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
    example: 'claimStatus',
    description:
      'Filterable fields: id, physicalDriveId, triggeringEventId, handledByVendorId, rmaTrackingNumber, claimStatus, notes, submittedAt, resolvedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
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
