import { build } from './id.query.params.builder';

describe('IdQueryParamsBuilder', () => {
  describe('build', () => {
    test('should build where clause for a single numeric id', () => {
      const result = build({ id: 10 });
      expect(result).toStrictEqual({ where: { id: [10] } });
    });

    test('should build where clause for an array of ids', () => {
      const result = build({ id: [1, 2, 3] });
      expect(result).toStrictEqual({ where: { id: [1, 2, 3] } });
    });

    test('should handle empty id array', () => {
      const result = build({ id: [] });
      expect(result).toStrictEqual({ where: { id: [] } });
    });

    test('should return empty object when no id is provided', () => {
      const result = build({});
      expect(result).toStrictEqual({ where: { id: [] } });
    });
  });
});
