import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { Currency } from './entities/currency.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

describe('CurrencyService', () => {
  let service: CurrencyService;
  // Fixed: Swapped loose 'any' definitions for typed mock records
  let mockCurrencyModel: Record<string, jest.Mock>;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock the Sequelize Model Static Methods
    mockCurrencyModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };

    // 2. Mock the PaginationService using an unknown double-cast wrapper
    mockPaginationService = {
      paginate: jest.fn(),
    } as unknown as jest.Mocked<PaginationService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: getModelToken(Currency),
          useValue: mockCurrencyModel,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
    jest.clearAllMocks();
  });

  describe('createCurrency', () => {
    const createDto: CreateCurrencyDto = {
      name: 'US Dollar',
      code: 'USD',
      symbol: '$',
    };

    it('should successfully create a currency if name and code are unique', async () => {
      mockCurrencyModel.findOne.mockResolvedValue(null); // Neither name nor code exists
      mockCurrencyModel.create.mockResolvedValue({
        id: 'uuid-1',
        ...createDto,
      });

      const result = await service.createCurrency(createDto);

      expect(result).toBeDefined();
      expect(mockCurrencyModel.create).toHaveBeenCalledWith({ ...createDto });
    });

    it('should throw ConflictException if currency name already exists', async () => {
      mockCurrencyModel.findOne.mockImplementation(
        ({ where }: { where: Record<string, unknown> }) => {
          if (where && typeof where === 'object' && 'name' in where) {
            return Promise.resolve({ id: 'existing-id', name: 'US Dollar' });
          }
          return Promise.resolve(null);
        },
      );

      await expect(service.createCurrency(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockCurrencyModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCurrency', () => {
    const updateDto: UpdateCurrencyDto = { name: 'United States Dollar' };

    it('should successfully update a non-managed currency', async () => {
      const mockInstance = {
        id: 'uuid-1',
        managed: false,
        update: jest
          .fn()
          .mockResolvedValue({ id: 'uuid-1', name: 'United States Dollar' }),
      };
      mockCurrencyModel.findByPk.mockResolvedValue(mockInstance);
      mockCurrencyModel.findOne.mockResolvedValue(null); // No name naming conflict

      await service.updateCurrency('uuid-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'United States Dollar' }),
      );
    });

    it('should throw ConflictException when trying to update a system-managed currency', async () => {
      const mockInstance = { id: 'uuid-1', managed: true };
      mockCurrencyModel.findByPk.mockResolvedValue(mockInstance);

      await expect(service.updateCurrency('uuid-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteCurrency', () => {
    it('should successfully delete a currency if it is not managed', async () => {
      const mockInstance = { id: 'uuid-1', managed: false };
      mockCurrencyModel.findByPk.mockResolvedValue(mockInstance);
      mockCurrencyModel.destroy.mockResolvedValue(1); // 1 row deleted

      const result = await service.deleteCurrency('uuid-1');

      expect(result).toBe(true);
      expect(mockCurrencyModel.destroy).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException if currency to delete does not exist', async () => {
      mockCurrencyModel.findByPk.mockResolvedValue(null);

      await expect(service.deleteCurrency('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllCurrencies', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      // Fixed: Explicit structural type definition to satisfy return assignments safely
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: (Currency & { itemNumber: number })[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockCurrencyModel as unknown as typeof Currency,
        mockQuery,
      );
    });
  });
});
