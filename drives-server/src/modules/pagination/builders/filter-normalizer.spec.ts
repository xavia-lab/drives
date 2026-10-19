import { BadRequestException } from '@nestjs/common';
import { describe, it, expect } from 'vitest';
import { normalizeFilters } from './filter-normalizer';

describe('normalizeFilters', () => {
  describe('id', () => {
    it('normalizes a single id into an IN condition', () => {
      expect(normalizeFilters({ id: 'drive-1' })).toEqual([
        { field: 'id', operator: 'in', value: 'drive-1' },
      ]);
    });

    it('normalizes arrays and comma-separated ids', () => {
      expect(normalizeFilters({ id: ['a', 'b'] })).toEqual([
        { field: 'id', operator: 'in', value: 'a,b' },
      ]);
      expect(normalizeFilters({ id: 'a,b' })).toEqual([
        { field: 'id', operator: 'in', value: 'a,b' },
      ]);
    });

    it('ignores an empty id', () => {
      expect(normalizeFilters({ id: '' })).toEqual([]);
      expect(normalizeFilters({ id: [] })).toEqual([]);
    });
  });

  describe('structured filters', () => {
    it('parses a single JSON object', () => {
      expect(
        normalizeFilters({
          filters: '{"field":"name","operator":"eq","value":"Samsung"}',
        }),
      ).toEqual([{ field: 'name', operator: 'eq', value: 'Samsung' }]);
    });

    it('parses a JSON array of conditions', () => {
      expect(
        normalizeFilters({
          filters: JSON.stringify([
            { field: 'name', operator: 'like', value: 'GB' },
            { field: 'createdAt', operator: 'gte', value: '2026-01-01' },
          ]),
        }),
      ).toEqual([
        { field: 'name', operator: 'like', value: 'GB' },
        { field: 'createdAt', operator: 'gte', value: '2026-01-01' },
      ]);
    });

    it('parses repeated params (array of JSON strings)', () => {
      expect(
        normalizeFilters({
          filters: [
            '{"field":"a","operator":"eq","value":"1"}',
            '{"field":"b","operator":"ne","value":"2"}',
          ],
        }),
      ).toEqual([
        { field: 'a', operator: 'eq', value: '1' },
        { field: 'b', operator: 'ne', value: '2' },
      ]);
    });

    it('accepts already-parsed objects and arrays', () => {
      expect(
        normalizeFilters({
          filters: [{ field: 'a', operator: 'eq', value: 1 }],
        }),
      ).toEqual([{ field: 'a', operator: 'eq', value: '1' }]);
    });

    it('normalizes array values to comma-separated strings', () => {
      expect(
        normalizeFilters({
          filters: [{ field: 'id', operator: 'in', value: ['a', 'b'] }],
        }),
      ).toEqual([{ field: 'id', operator: 'in', value: 'a,b' }]);
    });

    it('rejects malformed JSON', () => {
      expect(() => normalizeFilters({ filters: 'not-json' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects non-object JSON entries', () => {
      expect(() => normalizeFilters({ filters: '42' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects invalid field names', () => {
      expect(() =>
        normalizeFilters({
          filters: [{ field: 'name; DROP TABLE', operator: 'eq', value: 'x' }],
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects invalid operators', () => {
      expect(() =>
        normalizeFilters({
          filters: [{ field: 'name', operator: 'regex', value: 'x' }],
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects empty values', () => {
      expect(() =>
        normalizeFilters({
          filters: [{ field: 'name', operator: 'eq', value: '' }],
        }),
      ).toThrow(BadRequestException);
    });

    it('normalizes operator casing', () => {
      expect(
        normalizeFilters({
          filters: [{ field: 'name', operator: 'LIKE', value: 'x' }],
        }),
      ).toEqual([{ field: 'name', operator: 'like', value: 'x' }]);
    });
  });

  it('combines id and structured filters', () => {
    expect(
      normalizeFilters({
        id: 'drive-1',
        filters: [
          { field: 'name', operator: 'like', value: 'GB' },
          { field: 'status', operator: 'eq', value: 'active' },
        ],
      }),
    ).toEqual([
      { field: 'id', operator: 'in', value: 'drive-1' },
      { field: 'name', operator: 'like', value: 'GB' },
      { field: 'status', operator: 'eq', value: 'active' },
    ]);
  });
});
