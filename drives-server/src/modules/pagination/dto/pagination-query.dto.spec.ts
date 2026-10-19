import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, it, expect } from 'vitest';
import { PaginationQueryDto } from './pagination-query.dto';
import { FilterConditionDto } from './filter-condition.dto';

const toDto = (value: Record<string, unknown>) =>
  plainToInstance(PaginationQueryDto, value);

describe('PaginationQueryDto filters', () => {
  it('transforms a JSON array string into nested filter conditions', async () => {
    const dto = toDto({
      filters: JSON.stringify([
        { field: 'name', operator: 'like', value: 'GB' },
        { field: 'createdAt', operator: 'gte', value: '2026-01-01' },
      ]),
    });

    expect(dto.filters).toHaveLength(2);
    expect(dto.filters?.[0]).toBeInstanceOf(FilterConditionDto);
    expect(dto.filters?.[0]).toMatchObject({
      field: 'name',
      operator: 'like',
      value: 'GB',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('transforms repeated params into multiple filter conditions', async () => {
    const dto = toDto({
      filters: [
        JSON.stringify({ field: 'a', operator: 'eq', value: '1' }),
        JSON.stringify({ field: 'b', operator: 'ne', value: '2' }),
      ],
    });

    expect(dto.filters).toHaveLength(2);
    expect(await validate(dto)).toHaveLength(0);
  });

  it('normalizes array values to comma-separated strings', async () => {
    const dto = toDto({
      filters: JSON.stringify([
        { field: 'id', operator: 'in', value: ['a', 'b'] },
      ]),
    });

    expect(dto.filters?.[0].value).toBe('a,b');
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects malformed JSON with a validation error', async () => {
    const dto = toDto({ filters: 'not-json' });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'filters')).toBe(true);
  });

  it('rejects invalid operators', async () => {
    const dto = toDto({
      filters: JSON.stringify([
        { field: 'name', operator: 'regex', value: 'x' },
      ]),
    });

    const errors = await validate(dto);
    expect(JSON.stringify(errors)).toContain('operator');
  });

  it('rejects invalid field identifiers', async () => {
    const dto = toDto({
      filters: JSON.stringify([
        { field: 'name; DROP TABLE', operator: 'eq', value: 'x' },
      ]),
    });

    const errors = await validate(dto);
    expect(JSON.stringify(errors)).toContain('field');
  });
});
