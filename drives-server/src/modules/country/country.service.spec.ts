import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CountryService } from './country.service';
import { Country } from './entities/country.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

describe('CountryService', () => {
  let service: CountryService;
  let mockCountryModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock the Sequelize Model Static Methods
    mockCountryModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };

    // 2. Mock the PaginationService
    mockPaginationService = {
      paginate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountryService,
        {
          provide: getModelToken(Country),
          useValue: mockCountryModel,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<CountryService>(CountryService);
    jest.clearAllMocks();
  });

  describe('createCountry', () => {
    const createDto: CreateCountryDto = { name: 'United States', code: 'US' };

    it('should successfully create a country if name and code are unique', async () => {
      mockCountryModel.findOne.mockResolvedValue(null); // Neither name nor code conflicts
      mockCountryModel.create.mockResolvedValue({
        id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
        ...createDto,
      });

      const result = await service.createCountry(createDto);

      expect(result).toBeDefined();
      expect(mockCountryModel.create).toHaveBeenCalledWith({ ...createDto });
    });

    it('should throw ConflictException if country name already exists', async () => {
      mockCountryModel.findOne.mockImplementation(({ where }) => {
        if (where.name) return { id: 'existing-id', name: 'United States' };
        return null;
      });

      await expect(service.createCountry(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockCountryModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCountry', () => {
    const updateDto: UpdateCountryDto = { name: 'United States of America' };

    it('should successfully update a non-managed country', async () => {
      const mockInstance = {
        id: 'uuid-1',
        managed: false,
        update: jest.fn().mockResolvedValue({
          id: 'uuid-1',
          name: 'United States of America',
        }),
      };
      mockCountryModel.findByPk.mockResolvedValue(mockInstance);
      mockCountryModel.findOne.mockResolvedValue(null); // No name collision

      await service.updateCountry('uuid-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'United States of America' }),
      );
    });

    it('should throw ConflictException when trying to update a system-managed country', async () => {
      const mockInstance = { id: 'uuid-1', managed: true };
      mockCountryModel.findByPk.mockResolvedValue(mockInstance);

      await expect(service.updateCountry('uuid-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteCountry', () => {
    it('should successfully delete a country if it is not managed', async () => {
      const mockInstance = { id: 'uuid-1', managed: false };
      mockCountryModel.findByPk.mockResolvedValue(mockInstance);
      mockCountryModel.destroy.mockResolvedValue(1); // 1 row removed

      const result = await service.deleteCountry('uuid-1');

      expect(result).toBe(true);
      expect(mockCountryModel.destroy).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException if country to delete does not exist', async () => {
      mockCountryModel.findByPk.mockResolvedValue(null);

      await expect(service.deleteCountry('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockCountryModel,
        mockQuery,
      );
    });
  });
});
