import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FilterConditionDto } from './filter-condition.dto';

// Define a safe interface signature layout for the incoming Transform parameter context
interface TransformFnParams {
  value: unknown;
  key: string;
  obj: Record<string, unknown>;
  type: number;
}

/**
 * Normalizes the structured `filters` query param. It accepts:
 *  - a single JSON object: `filters={"field":"name","operator":"eq","value":"x"}`
 *  - a JSON array: `filters=[{"field":"a",...},{"field":"b",...}]`
 *  - repeated params: `filters={...}&filters={...}`
 *  - bracket notation parsed by qs into objects/arrays
 *
 * Malformed entries are replaced with a placeholder so class-validator can
 * return a 400 with useful nested messages instead of a 500.
 */
const parseFilters = (value: unknown): FilterConditionDto[] | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const entries: unknown[] = Array.isArray(value)
    ? (value as unknown[])
    : [value];

  const parsedEntries: unknown[] = entries.flatMap((entry) => {
    if (Array.isArray(entry)) {
      return entry as unknown[];
    }
    if (entry && typeof entry === 'object') {
      return [entry];
    }
    if (typeof entry !== 'string') {
      return [{ invalid: true }];
    }
    try {
      const parsed: unknown = JSON.parse(entry);
      if (Array.isArray(parsed)) {
        return parsed as unknown[];
      }
      if (parsed && typeof parsed === 'object') {
        return [parsed];
      }
      return [{ invalid: true }];
    } catch {
      return [{ invalid: true }];
    }
  });

  // Instantiate explicitly: `@Type` runs before this transform, so parsing the
  // JSON here would otherwise yield plain objects that skip nested validation.
  return parsedEntries.map((entry) =>
    plainToInstance(FilterConditionDto, entry),
  );
};

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
  // Structured multi-filter form (all conditions are ANDed together).
  @ApiPropertyOptional({
    description:
      'JSON filter condition or array of conditions, ANDed together. Example: [{"field":"name","operator":"like","value":"GB"}]',
    type: String,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown => parseFilters(value))
  @IsArray()
  @ValidateNested({ each: true })
  filters?: FilterConditionDto[];
}
