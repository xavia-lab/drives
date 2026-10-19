import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FILTER_OPERATORS } from '../filter.types';
import type { FilterOperator } from '../filter.types';

/**
 * One condition of the structured `filters` query parameter.
 * Example: `[{"field":"name","operator":"like","value":"GB"}]`
 */
export class FilterConditionDto {
  @ApiProperty({
    example: 'name',
    description: 'The column to filter on',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'field must be a valid column identifier',
  })
  field: string;

  @ApiProperty({
    enum: FILTER_OPERATORS,
    example: 'eq',
    description: 'The comparison operator',
  })
  @IsIn(FILTER_OPERATORS)
  operator: FilterOperator;

  @ApiProperty({
    example: 'Samsung',
    description:
      'The comparison value. For `in`/`between`, use comma-separated values.',
  })
  @Transform(({ value }) =>
    value === undefined || value === null
      ? ''
      : Array.isArray(value)
        ? value.map((item) => String(item)).join(',')
        : String(value),
  )
  @IsString()
  @IsNotEmpty()
  value: string;
}
