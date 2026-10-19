import { BadRequestException } from '@nestjs/common';
import {
  FILTER_OPERATORS,
  FilterCondition,
  FilterOperator,
  RawFilterParams,
} from '../filter.types';

const FIELD_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const isFilterOperator = (value: unknown): value is FilterOperator =>
  typeof value === 'string' &&
  (FILTER_OPERATORS as readonly string[]).includes(value.toLowerCase());

const asArray = (value: unknown): unknown[] => {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};
const describeValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value) ?? 'unknown';
};

const normalizeValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map(normalizeValue).join(',');
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

const parseOperator = (value: unknown): FilterOperator => {
  const operator = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!isFilterOperator(operator)) {
    throw new BadRequestException(
      `Invalid filter operator "${describeValue(value)}". Allowed operators: ${FILTER_OPERATORS.join(', ')}`,
    );
  }
  return operator;
};

const toCondition = (raw: Record<string, unknown>): FilterCondition => {
  const field = typeof raw.field === 'string' ? raw.field.trim() : '';
  if (!FIELD_PATTERN.test(field)) {
    throw new BadRequestException(
      `Invalid filter field "${describeValue(raw.field)}"`,
    );
  }

  const value = normalizeValue(raw.value);
  if (value.length === 0) {
    throw new BadRequestException(
      `Filter value for field "${field}" must not be empty`,
    );
  }

  return { field, operator: parseOperator(raw.operator), value };
};

// Parses one entry of the structured `filters` param. Accepts a JSON object, a
// JSON array, or an already-parsed object (useful when the DTO transform ran).
const parseStructuredEntry = (entry: unknown): Record<string, unknown>[] => {
  if (Array.isArray(entry)) {
    return entry.flatMap((item) => parseStructuredEntry(item));
  }

  if (entry && typeof entry === 'object') {
    return [entry as Record<string, unknown>];
  }

  if (typeof entry !== 'string') {
    throw new BadRequestException(
      'Each filter must be a JSON object or an array of JSON objects',
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(entry);
  } catch {
    throw new BadRequestException(`Invalid filters JSON: ${entry}`);
  }

  if (Array.isArray(parsed)) {
    return parsed.flatMap((item) => parseStructuredEntry(item));
  }
  if (parsed && typeof parsed === 'object') {
    return [parsed as Record<string, unknown>];
  }

  throw new BadRequestException(
    'Each filter must be a JSON object or an array of JSON objects',
  );
};

/**
 * Normalizes every supported filter input into a single AND-able list.
 *
 * - `id` (single value or comma-separated/repeated) becomes `id IN (...)`.
 * - `filters` accepts repeated JSON objects or a single JSON array.
 */
export const normalizeFilters = (
  params: RawFilterParams,
): FilterCondition[] => {
  const conditions: FilterCondition[] = [];

  // Direct id lookups (also used by Refine's `getMany`).
  const ids = asArray(params.id)
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0);
  if (ids.length > 0) {
    conditions.push({ field: 'id', operator: 'in', value: ids.join(',') });
  }

  // Structured filters: `filters=[{...}]` or `filters={...}&filters={...}`.
  for (const entry of asArray(params.filters)) {
    for (const raw of parseStructuredEntry(entry)) {
      conditions.push(toCondition(raw));
    }
  }

  return conditions;
};
