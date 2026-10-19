import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';

export class QueryWarrantyClaimDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, physicalDriveId, triggeringEventId, handledByVendorId, rmaTrackingNumber, notes, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey',
    'physicalDriveId',
    'triggeringEventId',
    'handledByVendorId',
    'rmaTrackingNumber',
    'notes',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;
}
