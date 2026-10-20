import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheKeyBuilder } from './cache-key.builder';
import { CacheService } from './cache.service';
import { ValkeyService } from './valkey.service';

describe('CacheService', () => {
  let service: CacheService;
  let valkey: {
    isEnabled: ReturnType<typeof vi.fn>;
    isAvailable: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    incr: ReturnType<typeof vi.fn>;
    mget: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    valkey = {
      isEnabled: vi.fn(() => true),
      isAvailable: vi.fn(() => true),
      get: vi.fn(),
      set: vi.fn(),
      incr: vi.fn(),
      mget: vi.fn(),
    };

    const config = {
      get: vi.fn((key: string, fallback: unknown) => {
        const values: Record<string, unknown> = {
          'cache.defaultTtlMs': 60_000,
          'cache.maxResponseBytes': 1_000,
        };
        return values[key] ?? fallback;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        CacheKeyBuilder,
        { provide: ValkeyService, useValue: valkey },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(CacheService);
  });

  it('reads tag versions and defaults missing versions to zero', async () => {
    valkey.mget.mockResolvedValue(['3', null]);

    await expect(service.getTagVersions(['a', 'b'])).resolves.toEqual({
      a: '3',
      b: '0',
    });
  });

  it('stores responses with a jittered TTL', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    valkey.set.mockResolvedValue(true);

    await service.set('key', { statusCode: 200, body: { ok: true } }, 1_000);

    expect(valkey.set).toHaveBeenCalledWith(
      'key',
      { statusCode: 200, body: { ok: true } },
      1_000,
    );
  });

  it('skips oversized responses', async () => {
    const response = { statusCode: 200, body: { value: 'x'.repeat(2_000) } };

    await expect(service.set('key', response, 1_000)).resolves.toBe(false);
    expect(valkey.set).not.toHaveBeenCalled();
  });

  it('invalidates each tag with an increment', async () => {
    valkey.incr.mockResolvedValue(2);

    await service.invalidateTags(['currencies', 'countries']);

    expect(valkey.incr).toHaveBeenCalledWith('tag:currencies:version');
    expect(valkey.incr).toHaveBeenCalledWith('tag:countries:version');
  });

  it('reads cached responses through the Valkey client', async () => {
    const cached = { statusCode: 200, body: { ok: true } };
    valkey.get.mockResolvedValue(cached);

    await expect(service.get('key')).resolves.toEqual(cached);
  });
});
