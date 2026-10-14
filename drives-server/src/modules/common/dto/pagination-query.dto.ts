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

// Define a safe interface signature layout for the incoming Transform parameter context
interface TransformFnParams {
  value: unknown;
  key: string;
  obj: Record<string, unknown>;
  type: number;
}

export class PaginationQueryDto {
  // ====================== ID ======================
  @ApiPropertyOptional({
    description: 'Single ID or comma-separated list/array of IDs',
    example: '1,2,3',
  })
  @IsOptional()
  // Fixed: Typed parameter context to destroy the implicit "any" and verify primitive boundaries
  @Transform(({ value }: TransformFnParams): unknown => {
    if (!value) return value;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      return value.toString().split(',');
    }
    return value;
  })
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
  // Fixed: Add explicit type to the validating object parameter 'o' to satisfy line 68 limits
  @ValidateIf((o: PaginationQueryDto) => o.filterField !== undefined)
  @IsNotEmpty({
    message: 'filterValue is required when filterField is provided',
  })
  @IsString()
  filterValue?: string;
}
