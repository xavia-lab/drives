// src/utils/strings.util.spec.ts
import { describe, it, expect } from 'vitest'; // 🚀 Pure ESM imports from Vitest
import { titleCaseString } from './strings.util';

describe('Strings Handler Tests', () => {
  describe('titleCaseString', () => {
    it('should convert a single word to title case', () => {
      // 🚀 Swapped out legacy test blocks for 'it'
      expect(titleCaseString('cat')).toBe('Cat');
    });

    it('should replace underscores with spaces and capitalize each word', () => {
      expect(titleCaseString('sales_representative')).toBe(
        'Sales Representative',
      );
    });

    it('should handle strings with mixed cases and underscores', () => {
      expect(titleCaseString('hello_world_123')).toBe('Hello World 123');
    });

    it('should handle empty string', () => {
      expect(titleCaseString('')).toBe('');
    });

    it('should handle string with only underscores', () => {
      expect(titleCaseString('___')).toBe('   ');
    });
  });
});
