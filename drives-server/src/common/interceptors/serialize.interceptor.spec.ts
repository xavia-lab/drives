import { SerializeInterceptor } from './serialize.interceptor';
import { of } from 'rxjs';
import { MockDto } from './mock.dto';

describe('SerializeInterceptor', () => {
  let interceptor: SerializeInterceptor;

  beforeEach(() => {
    interceptor = new SerializeInterceptor(MockDto);
  });

  const mockExecutionContext = {} as any; // Not used in this specific logic

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform a single object and strip unexposed fields', (done) => {
    const mockData = { id: 1, name: 'Test', password: 'secret123' };
    const callHandler = {
      handle: () => of(mockData),
    };

    interceptor
      .intercept(mockExecutionContext, callHandler)
      .subscribe((result) => {
        expect(result).toEqual({ id: 1, name: 'Test' });
        expect(result.password).toBeUndefined();
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
    const callHandler = {
      handle: () => of(mockSequelizeInstance),
    };

    interceptor
      .intercept(mockExecutionContext, callHandler)
      .subscribe((result) => {
        expect(mockSequelizeInstance.get).toHaveBeenCalledWith({ plain: true });
        expect(result).toEqual({ id: 1, name: 'Sequelize' });
        done();
      });
  });

  it('should transform an array of objects', (done) => {
    const mockArray = [
      { id: 1, name: 'A', password: '1' },
      { id: 2, name: 'B', password: '2' },
    ];
    const callHandler = {
      handle: () => of(mockArray),
    };

    interceptor
      .intercept(mockExecutionContext, callHandler)
      .subscribe((result) => {
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1, name: 'A' });
        expect(result[0].password).toBeUndefined();
        done();
      });
  });

  it('should transform paginated data while preserving metadata', (done) => {
    const mockPaginatedResponse = {
      data: [{ id: 1, name: 'Item 1', password: 'pwd' }],
      meta: { totalItems: 1, currentPage: 1 },
    };
    const callHandler = {
      handle: () => of(mockPaginatedResponse),
    };

    interceptor
      .intercept(mockExecutionContext, callHandler)
      .subscribe((result) => {
        expect(result.meta).toEqual(mockPaginatedResponse.meta);
        expect(result.data[0]).toEqual({ id: 1, name: 'Item 1' });
        expect(result.data[0].password).toBeUndefined();
        done();
      });
  });

  it('should return null or undefined as is', (done) => {
    const callHandler = {
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
