import { build } from './id.query.params.builder';
import { describe, it, expect } from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('IdQueryParamsBuilder', () => {
  describe('build', () => {
    it('should build where clause for a single numeric id', () => {
      const result = build({ id: 10 });
      expect(result).toStrictEqual({ where: { id: [10] } });
    });

    it('should build where clause for an array of ids', () => {
      const result = build({ id: [1, 2, 3] });
      expect(result).toStrictEqual({ where: { id: [1, 2, 3] } });
    });

    it('should handle empty id array', () => {
      const result = build({ id: [] });
      expect(result).toStrictEqual({ where: { id: [] } });
    });

    it('should return empty object when no id is provided', () => {
      const result = build({});
      expect(result).toStrictEqual({ where: { id: [] } });
    });
  });
});
