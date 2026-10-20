import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INVALIDATE_CACHE_METADATA } from './cache.decorators';
import { CacheInvalidationInterceptor } from './cache-invalidation.interceptor';
import { CacheService } from './cache.service';
import { HttpCacheInterceptor } from './http-cache.interceptor';

const makeContext = (
  method: string,
  query: Record<string, unknown> = {},
  user?: { id: string },
): { context: ExecutionContext; setHeader: ReturnType<typeof vi.fn> } => {
  const setHeader = vi.fn();
  const request = {
    method,
    baseUrl: '',
    path: '/api/v1/currencies',
    query,
    user,
  };
  const response = { statusCode: 200, setHeader };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;

  return { context, setHeader };
};

describe('HttpCacheInterceptor', () => {
  let cache: {
    isEnabled: ReturnType<typeof vi.fn>;
    getTagVersions: ReturnType<typeof vi.fn>;
    buildKey: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let interceptor: HttpCacheInterceptor;

  beforeEach(() => {
    cache = {
      isEnabled: vi.fn(() => true),
      getTagVersions: vi.fn().mockResolvedValue({ currencies: '1' }),
      buildKey: vi.fn(() => 'cache-key'),
      get: vi.fn(),
      set: vi.fn().mockResolvedValue(true),
    };
    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue({ tags: ['currencies'] }),
    };
    interceptor = new HttpCacheInterceptor(
      reflector as unknown as Reflector,
      cache as unknown as CacheService,
    );
  });

  it('returns the cached serialized body without calling the handler', async () => {
    cache.get.mockResolvedValue({
      statusCode: 200,
      body: { cached: true },
    });
    const handle = vi.fn(() => of({ fresh: true }));
    const { context, setHeader } = makeContext('GET', { pageNumber: '1' });

    const result = await firstValueFrom(
      interceptor.intercept(context, { handle } as CallHandler),
    );

    expect(result).toEqual({ cached: true });
    expect(handle).not.toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
  });

  it('runs the handler on a miss and stores the body', async () => {
    cache.get.mockResolvedValue(null);
    const body = { fresh: true };
    const { context, setHeader } = makeContext('GET', { pageNumber: '1' });

    const result = await firstValueFrom(
      interceptor.intercept(context, {
        handle: () => of(body),
      } as CallHandler),
    );

    expect(result).toEqual(body);
    expect(setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    expect(cache.set).toHaveBeenCalledWith(
      'cache-key',
      { statusCode: 200, body },
      undefined,
    );
  });

  it('ignores non-GET requests and routes without cache metadata', async () => {
    const handle = vi.fn(() => of({ ok: true }));
    const post = makeContext('POST');
    await firstValueFrom(
      interceptor.intercept(post.context, { handle } as CallHandler),
    );
    expect(handle).toHaveBeenCalled();
    expect(cache.get).not.toHaveBeenCalled();

    reflector.getAllAndOverride.mockReturnValue(undefined);
    const get = makeContext('GET');
    await firstValueFrom(
      interceptor.intercept(get.context, { handle } as CallHandler),
    );
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('can scope a cached response to the authenticated user', async () => {
    cache.get.mockResolvedValue(null);
    const { context } = makeContext('GET', {}, { id: 'user-1' });
    reflector.getAllAndOverride.mockReturnValue({
      tags: ['currencies'],
      private: true,
    });

    await firstValueFrom(
      interceptor.intercept(context, {
        handle: () => of({ ok: true }),
      } as CallHandler),
    );

    const keyInput = cache.buildKey.mock.calls[0][0] as {
      query: Record<string, unknown>;
    };
    expect(keyInput.query.__user).toBe('user-1');
  });
});

describe('CacheInvalidationInterceptor', () => {
  it('invalidates tags after a successful mutation', async () => {
    const invalidateTags = vi.fn().mockResolvedValue(undefined);
    const cache = {
      isEnabled: () => true,
      invalidateTags,
    } as unknown as CacheService;
    const reflector = {
      getAllAndOverride: vi
        .fn()
        .mockImplementation((key: string) =>
          key === INVALIDATE_CACHE_METADATA ? ['currencies'] : undefined,
        ),
    } as unknown as Reflector;
    const interceptor = new CacheInvalidationInterceptor(reflector, cache);
    const { context } = makeContext('POST');

    await firstValueFrom(
      interceptor.intercept(context, {
        handle: () => of({ ok: true }),
      } as CallHandler),
    );

    expect(invalidateTags).toHaveBeenCalledWith(['currencies']);
    expect(
      (reflector as unknown as { getAllAndOverride: ReturnType<typeof vi.fn> })
        .getAllAndOverride,
    ).toHaveBeenCalledWith(INVALIDATE_CACHE_METADATA, expect.any(Array));
  });

  it('does not invalidate when the mutation fails', async () => {
    const invalidateTags = vi.fn();
    const cache = {
      isEnabled: () => true,
      invalidateTags,
    } as unknown as CacheService;
    const reflector = {
      getAllAndOverride: () => ['currencies'],
    } as unknown as Reflector;
    const interceptor = new CacheInvalidationInterceptor(reflector, cache);
    const { context } = makeContext('POST');

    await expect(
      firstValueFrom(
        interceptor.intercept(context, {
          handle: () => throwError(() => new Error('failed')),
        } as CallHandler),
      ),
    ).rejects.toThrow('failed');
    expect(invalidateTags).not.toHaveBeenCalled();
  });
});
