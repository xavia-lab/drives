// src/utils/objects.util.spec.ts
import { describe, it, expect } from 'vitest'; // 🚀 Pure ESM imports from Vitest
import {
  isEmpty,
  isNotEmpty,
  isObjectEmpty,
  isObjectNotEmpty,
} from './objects.util';

describe('Object Handler Tests', () => {
  describe('isEmpty', () => {
    it('should return false for non-empty values', () => {
      // 🚀 Swapped out legacy test blocks for 'it'
      expect(isEmpty('cat')).toBeFalsy();
      expect(isEmpty(1)).toBeFalsy();
      expect(isEmpty([])).toBeFalsy();
      expect(isEmpty({})).toBeFalsy();
      expect(isEmpty(false)).toBeFalsy();
      expect(isEmpty(0)).toBeFalsy();
      expect(isEmpty(-0)).toBeFalsy();
      expect(isEmpty(NaN)).toBeFalsy();
    });

    it('should return true for empty values', () => {
      expect(isEmpty('')).toBeTruthy();
      expect(isEmpty('    ')).toBeTruthy();
      expect(isEmpty(null)).toBeTruthy();
      expect(isEmpty(undefined)).toBeTruthy();
    });
  });

  describe('isNotEmpty', () => {
    it('should return true for non-empty values', () => {
      expect(isNotEmpty('cat')).toBeTruthy();
      expect(isNotEmpty(1)).toBeTruthy();
      expect(isNotEmpty([])).toBeTruthy();
      expect(isNotEmpty({})).toBeTruthy();
      expect(isNotEmpty(false)).toBeTruthy();
      expect(isNotEmpty(0)).toBeTruthy();
      expect(isNotEmpty(-0)).toBeTruthy();
      expect(isNotEmpty(NaN)).toBeTruthy();
    });

    it('should return false for empty values', () => {
      expect(isNotEmpty('')).toBeFalsy();
      expect(isNotEmpty('    ')).toBeFalsy();
      expect(isNotEmpty(null)).toBeFalsy();
      expect(isNotEmpty(undefined)).toBeFalsy();
    });
  });

  describe('isObjectEmpty', () => {
    it('should return true for empty object', () => {
      expect(isObjectEmpty({})).toBeTruthy();
    });

    it('should return false for non-empty object', () => {
      expect(isObjectEmpty({ a: 10 })).toBeFalsy();
    });

    it('should return false for array', () => {
      expect(isObjectEmpty([])).toBeFalsy();
    });
  });

  describe('isObjectNotEmpty', () => {
    it('should return false for empty object', () => {
      expect(isObjectNotEmpty({})).toBeFalsy();
    });

    it('should return true for non-empty object', () => {
      expect(isObjectNotEmpty({ a: 10 })).toBeTruthy();
    });
  });
});
