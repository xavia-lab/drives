import { SerializeInterceptor } from './serialize.interceptor';
import { of } from 'rxjs';
import { MockDto } from './mock.dto';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('SerializeInterceptor', () => {
  let interceptor: SerializeInterceptor;

  beforeEach(() => {
    interceptor = new SerializeInterceptor(MockDto);
  });

  // Cast an empty object using 'unknown' first to safely spoof the Framework type definition
  const mockExecutionContext = {} as unknown as ExecutionContext;

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform a single object and strip unexposed fields', (done) => {
    const mockData = { id: 1, name: 'Test', password: 'secret123' };
    const callHandler: CallHandler = {
      handle: () => of(mockData),
    };

    interceptor
      .intercept(mockExecutionContext, callHandler)
      .subscribe((result) => {
        // Assert as Record to avoid implicit "any" member access warnings on .password
        const res = result as Record<string, unknown>;
        expect(res).toEqual({ id: 1, name: 'Test' });
        expect(res.password).toBeUndefined();
        done();
      });
  });

  it('should handle Sequelize-like objects with .get() method', (done) => {
    const mockSequelizeInstance = {
      id: 1,
      name: 'Sequelize',
      get: jest
        .fn()
        .mockReturnValue({ id: 1, name: 'Sequelize', password: 'abc' }),
    };
    const callHandler: CallHandler = {
      handle: () => of(mockSequelizeInstance),
    };

    interceptor.intercept(mockExecutionContext, callHandler).subscribe(() => {
      expect(mockSequelizeInstance.get).toHaveBeenCalledWith({ plain: true });
      done();
    });
  });

  it('should transform an array of objects', (done) => {
    const mockArray = [
      { id: 1, name: 'A', password: '1' },
      { id: 2, name: 'B', password: '2' },
    ];
    const callHandler: CallHandler = {
      handle: () => of(mockArray),
    };

    interceptor
      .intercept(mockExecutionContext, callHandler)
      .subscribe((result) => {
        const res = result as Record<string, unknown>[];
        expect(res).toHaveLength(2);
        expect(res[0]).toEqual({ id: 1, name: 'A' });
        expect(res[0].password).toBeUndefined();
        done();
      });
  });

  it('should transform paginated data while preserving metadata', (done) => {
    const mockPaginatedResponse = {
      data: [{ id: 1, name: 'Item 1', password: 'pwd' }],
      meta: { totalItems: 1, currentPage: 1 },
    };
    const callHandler: CallHandler = {
      handle: () => of(mockPaginatedResponse),
    };

    interceptor
      .intercept(mockExecutionContext, callHandler)
      .subscribe((result) => {
        const res = result as {
          meta: Record<string, unknown>;
          data: Record<string, unknown>[];
        };
        expect(res.meta).toEqual(mockPaginatedResponse.meta);
        expect(res.data[0]).toEqual({ id: 1, name: 'Item 1' });
        expect(res.data[0].password).toBeUndefined();
        done();
      });
  });

  it('should return null or undefined as is', (done) => {
    const callHandler: CallHandler = {
      handle: () => of(null),
    };

    interceptor
      .intercept(mockExecutionContext, callHandler)
      .subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
  });
});
