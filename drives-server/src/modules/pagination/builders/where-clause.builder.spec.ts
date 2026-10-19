import { BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';
import { describe, it, expect } from 'vitest';
import { FilterCondition, FilterOperator } from '../filter.types';
import { buildFilterCondition, buildWhere } from './where-clause.builder';

const condition = (
  operator: FilterOperator,
  value = 'x',
  field = 'name',
): FilterCondition => ({ field, operator, value });

describe('buildFilterCondition', () => {
  it.each([
    ['eq', Op.eq],
    ['ne', Op.ne],
    ['gt', Op.gt],
    ['gte', Op.gte],
    ['lt', Op.lt],
    ['lte', Op.lte],
  ] as const)('maps %s to the matching Sequelize operator', (operator, op) => {
    expect(buildFilterCondition(condition(operator, '10'))).toEqual({
      name: { [op]: '10' },
    });
  });

  it('maps `like` to a contains pattern', () => {
    expect(buildFilterCondition(condition('like', 'GB'))).toEqual({
      name: { [Op.like]: '%GB%' },
    });
  });

  it('maps `in` to a trimmed list', () => {
    expect(buildFilterCondition(condition('in', ' a, b ,, c '))).toEqual({
      name: { [Op.in]: ['a', 'b', 'c'] },
    });
  });

  it('maps `between` to a two-element range', () => {
    expect(
      buildFilterCondition(condition('between', '2026-01-01,2026-03-31')),
    ).toEqual({
      name: { [Op.between]: ['2026-01-01', '2026-03-31'] },
    });
  });

  it('rejects a malformed between range', () => {
    expect(() =>
      buildFilterCondition(condition('between', '2026-01-01')),
    ).toThrow(BadRequestException);
    expect(() => buildFilterCondition(condition('between', 'a,b,c'))).toThrow(
      BadRequestException,
    );
  });

  it('rejects an unknown operator', () => {
    expect(() =>
      buildFilterCondition(condition('regex' as FilterOperator, 'x')),
    ).toThrow(BadRequestException);
  });
});

describe('buildWhere', () => {
  it('returns undefined for no filters', () => {
    expect(buildWhere([])).toBeUndefined();
  });

  it('returns a single condition unwrapped', () => {
    expect(buildWhere([condition('eq', 'GB')])).toEqual({
      name: { [Op.eq]: 'GB' },
    });
  });

  it('ANDs multiple conditions across different fields', () => {
    expect(
      buildWhere([
        condition('like', 'GB', 'name'),
        condition('gte', '2026-01-01', 'createdAt'),
      ]),
    ).toEqual({
      [Op.and]: [
        { name: { [Op.like]: '%GB%' } },
        { createdAt: { [Op.gte]: '2026-01-01' } },
      ],
    });
  });

  it('ANDs multiple conditions on the same field (range)', () => {
    expect(
      buildWhere([
        condition('gte', '2026-01-01', 'purchaseDate'),
        condition('lte', '2026-03-31', 'purchaseDate'),
      ]),
    ).toEqual({
      [Op.and]: [
        { purchaseDate: { [Op.gte]: '2026-01-01' } },
        { purchaseDate: { [Op.lte]: '2026-03-31' } },
      ],
    });
  });
});
