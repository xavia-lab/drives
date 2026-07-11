// src/utils/objects.util.spec.ts
import {
  isEmpty,
  isNotEmpty,
  isObjectEmpty,
  isObjectNotEmpty,
} from './objects.util';

describe('Object Handler Tests', () => {
  describe('isEmpty', () => {
    test('should return false for non-empty values', () => {
      expect(isEmpty('cat')).toBeFalsy();
      expect(isEmpty(1)).toBeFalsy();
      expect(isEmpty([])).toBeFalsy();
      expect(isEmpty({})).toBeFalsy();
      expect(isEmpty(false)).toBeFalsy();
      expect(isEmpty(0)).toBeFalsy();
      expect(isEmpty(-0)).toBeFalsy();
      expect(isEmpty(NaN)).toBeFalsy();
    });

    test('should return true for empty values', () => {
      expect(isEmpty('')).toBeTruthy();
      expect(isEmpty('    ')).toBeTruthy();
      expect(isEmpty(null)).toBeTruthy();
      expect(isEmpty(undefined)).toBeTruthy();
    });
  });

  describe('isNotEmpty', () => {
    test('should return true for non-empty values', () => {
      expect(isNotEmpty('cat')).toBeTruthy();
      expect(isNotEmpty(1)).toBeTruthy();
      expect(isNotEmpty([])).toBeTruthy();
      expect(isNotEmpty({})).toBeTruthy();
      expect(isNotEmpty(false)).toBeTruthy();
      expect(isNotEmpty(0)).toBeTruthy();
      expect(isNotEmpty(-0)).toBeTruthy();
      expect(isNotEmpty(NaN)).toBeTruthy();
    });

    test('should return false for empty values', () => {
      expect(isNotEmpty('')).toBeFalsy();
      expect(isNotEmpty('    ')).toBeFalsy();
      expect(isNotEmpty(null)).toBeFalsy();
      expect(isNotEmpty(undefined)).toBeFalsy();
    });
  });

  describe('isObjectEmpty', () => {
    test('should return true for empty object', () => {
      expect(isObjectEmpty({})).toBeTruthy();
    });

    test('should return false for non-empty object', () => {
      expect(isObjectEmpty({ a: 10 })).toBeFalsy();
    });

    test('should return false for array', () => {
      expect(isObjectEmpty([])).toBeFalsy();
    });
  });

  describe('isObjectNotEmpty', () => {
    test('should return false for empty object', () => {
      expect(isObjectNotEmpty({})).toBeFalsy();
    });

    test('should return true for non-empty object', () => {
      expect(isObjectNotEmpty({ a: 10 })).toBeTruthy();
    });
  });
});
