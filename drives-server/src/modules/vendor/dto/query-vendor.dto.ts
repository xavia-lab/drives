import { IsOptional, IsIn, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryVendorDto extends PaginationQueryDto {
  // Override parent constraint to enforce strict sort field whitelisting for vendors
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable columns: id, displayKey, name, isManufacturer, isRetailer, countryId, createdAt, updatedAt',
    default: 'id',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support fast sequence-based sorting
    'name',
    'isManufacturer',
    'isRetailer',
    'countryId',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  // Enforce validation bounds matching the casing defined in your parent sortOrder ENUM block
  @ApiPropertyOptional({
    example: 'asc',
    enum: ['asc', 'desc'],
    description:
      'The global ordering direction parameter for sorting your queries',
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  declare sortOrder?: 'asc' | 'desc';

  // Override parent constraint to restrict query filtration bounds to true vendor entity parameters
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable columns for advanced expressions: id, displayKey, name, isManufacturer, isRetailer, countryId',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey',
    'name',
    'isManufacturer',
    'isRetailer',
    'countryId',
  ]) // 🌟 Added displayKey for direct index lookups
  declare filterField?: string;

  // Add support for global full-text searches outside of explicit advanced operator blocks
  @ApiPropertyOptional({
    example: 'Samsung',
    description:
      'Performs a global fuzzy case-insensitive wildcard text lookup (ILIKE %search%) across the name column',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  search?: string;
}
