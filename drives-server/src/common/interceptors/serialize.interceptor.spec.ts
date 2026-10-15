import { SerializeInterceptor } from './serialize.interceptor';
import { of, firstValueFrom } from 'rxjs'; // 🚀 Added firstValueFrom for clean async handling
import { MockDto } from './mock.dto';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('SerializeInterceptor', () => {
  let interceptor: SerializeInterceptor;

  beforeEach(() => {
    interceptor = new SerializeInterceptor(MockDto);
  });

  const mockExecutionContext = {} as unknown as ExecutionContext;

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform a single object and strip unexposed fields', async () => {
    const mockData = { id: 1, name: 'Test', password: 'secret123' };
    const callHandler: CallHandler = {
      handle: () => of(mockData),
    };

    // 🚀 Awaiting the stream value eliminates the need for legacy done() parameters
    const result = await firstValueFrom(
      interceptor.intercept(mockExecutionContext, callHandler),
    );

    const res = result as Record<string, unknown>;
    expect(res).toEqual({ id: 1, name: 'Test' });
    expect(res.password).toBeUndefined();
  });

  it('should handle Sequelize-like objects with .get() method', async () => {
    const mockSequelizeInstance = {
      id: 1,
      name: 'Sequelize',
      get: vi // 🚀 Swapped legacy jest.fn() with vitest vi.fn()
        .fn()
        .mockReturnValue({ id: 1, name: 'Sequelize', password: 'abc' }),
    };
    const callHandler: CallHandler = {
      handle: () => of(mockSequelizeInstance),
    };

    await firstValueFrom(
      interceptor.intercept(mockExecutionContext, callHandler),
    );

    expect(mockSequelizeInstance.get).toHaveBeenCalledWith({ plain: true });
  });

  it('should transform an array of objects', async () => {
    const mockArray = [
      { id: 1, name: 'A', password: '1' },
      { id: 2, name: 'B', password: '2' },
    ];
    const callHandler: CallHandler = {
      handle: () => of(mockArray),
    };

    const result = await firstValueFrom(
      interceptor.intercept(mockExecutionContext, callHandler),
    );

    const res = result as Record<string, unknown>[];
    expect(res).toHaveLength(2);
    expect(res[0]).toEqual({ id: 1, name: 'A' });
    expect(res[0].password).toBeUndefined();
  });

  it('should transform paginated data while preserving metadata', async () => {
    const mockPaginatedResponse = {
      data: [{ id: 1, name: 'Item 1', password: 'pwd' }],
      meta: { totalItems: 1, currentPage: 1 },
    };
    const callHandler: CallHandler = {
      handle: () => of(mockPaginatedResponse),
    };

    const result = await firstValueFrom(
      interceptor.intercept(mockExecutionContext, callHandler),
    );

    const res = result as {
      meta: Record<string, unknown>;
      data: Record<string, unknown>[];
    };
    expect(res.meta).toEqual(mockPaginatedResponse.meta);
    expect(res.data[0]).toEqual({ id: 1, name: 'Item 1' });
    expect(res.data[0].password).toBeUndefined();
  });

  it('should return null or undefined as is', async () => {
    const callHandler: CallHandler = {
      handle: () => of(null),
    };

    const result = await firstValueFrom(
      interceptor.intercept(mockExecutionContext, callHandler),
    );

    expect(result).toBeNull();
  });
});
