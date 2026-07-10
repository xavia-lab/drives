// src/utils/strings.util.spec.ts
import { titleCaseString } from './strings.util';

describe('Strings Handler Tests', () => {
  describe('titleCaseString', () => {
    test('should convert a single word to title case', () => {
      expect(titleCaseString('cat')).toBe('Cat');
    });

    test('should replace underscores with spaces and capitalize each word', () => {
      expect(titleCaseString('sales_representative')).toBe(
        'Sales Representative',
      );
    });

    test('should handle strings with mixed cases and underscores', () => {
      expect(titleCaseString('hello_world_123')).toBe('Hello World 123');
    });

    test('should handle empty string', () => {
      expect(titleCaseString('')).toBe('');
    });

    test('should handle string with only underscores', () => {
      expect(titleCaseString('___')).toBe('   ');
    });
  });
});
