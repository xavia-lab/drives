import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsIn,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  // ====================== ID ======================
  @ApiPropertyOptional({
    description: 'Single ID or comma-separated list/array of IDs',
    example: '1,2,3',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value?.toString()?.split(','),
  )
  id?: number | number[] | string | string[];

  // ====================== Pagination ======================
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  // ====================== Sorting ======================
  @ApiPropertyOptional({
    description: 'Comma-separated fields, e.g. "name,createdAt"',
  })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  // ====================== Filtering ======================
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filterField?: string;

  @ApiPropertyOptional({
    enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like', 'between'],
  })
  @IsOptional()
  @IsIn(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like', 'between'])
  filterOperator?: string;

  @ApiPropertyOptional()
  // Trigger validation for filterValue if filterField exists
  @ValidateIf((o) => o.filterField !== undefined)
  @IsNotEmpty({
    message: 'filterValue is required when filterField is provided',
  })
  @IsString()
  filterValue?: string;
}
