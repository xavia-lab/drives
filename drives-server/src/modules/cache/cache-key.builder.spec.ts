import { describe, expect, it } from 'vitest';
import { CacheKeyBuilder } from './cache-key.builder';

describe('CacheKeyBuilder', () => {
  const builder = new CacheKeyBuilder();

  it('produces the same key regardless of query key order', () => {
    const a = builder.build({
      method: 'GET',
      path: '/api/v1/currencies',
      query: { pageSize: '10', pageNumber: '1', filters: [{ field: 'code' }] },
      tagVersions: { currencies: '2', other: '1' },
    });
    const b = builder.build({
      method: 'GET',
      path: '/api/v1/currencies',
      query: { filters: [{ field: 'code' }], pageNumber: '1', pageSize: '10' },
      tagVersions: { other: '1', currencies: '2' },
    });

    expect(a).toBe(b);
  });

  it('changes when the query or a tag version changes', () => {
    const base = builder.build({
      method: 'GET',
      path: '/api/v1/currencies',
      query: { pageNumber: '1' },
      tagVersions: { currencies: '1' },
    });

    expect(
      builder.build({
        method: 'GET',
        path: '/api/v1/currencies',
        query: { pageNumber: '2' },
        tagVersions: { currencies: '1' },
      }),
    ).not.toBe(base);

    expect(
      builder.build({
        method: 'GET',
        path: '/api/v1/currencies',
        query: { pageNumber: '1' },
        tagVersions: { currencies: '2' },
      }),
    ).not.toBe(base);
  });

  it('uses a stable short key shape and tag version keys', () => {
    const key = builder.build({
      method: 'get',
      path: '/api/v1/currencies',
      query: {},
      tagVersions: {},
    });

    expect(key).toMatch(/^http:v1:[a-f0-9]{32}$/);
    expect(builder.tagVersionKey('currencies')).toBe('tag:currencies:version');
  });
});
