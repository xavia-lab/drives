import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatacenterService } from './datacenter.service';
import { Datacenter } from './entities/datacenter.entity';
import { Country } from '../country/entities/country.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateDatacenterDto } from './dto/create-datacenter.dto';
import { UpdateDatacenterDto } from './dto/update-datacenter.dto';

describe('DatacenterService', () => {
  let service: DatacenterService;
  let mockDatacenterModel: any;
  let mockCountryModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock both Sequelize models
    mockDatacenterModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };

    mockCountryModel = {
      findByPk: jest.fn(),
    };

    // 2. Mock the PaginationService
    mockPaginationService = {
      paginate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatacenterService,
        {
          provide: getModelToken(Datacenter),
          useValue: mockDatacenterModel,
        },
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

    service = module.get<DatacenterService>(DatacenterService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockDatacenterModel,
        mockQuery,
        { include: [Country] },
      );
    });
  });

  describe('findOne', () => {
    it('should successfully find and return a datacenter by ID', async () => {
      const mockFacility = { id: 'dc-uuid', code: 'VA-ASH-1' };
      mockDatacenterModel.findByPk.mockResolvedValue(mockFacility);

      const result = await service.findOne('dc-uuid');

      expect(result).toEqual(mockFacility);
      expect(mockDatacenterModel.findByPk).toHaveBeenCalledWith('dc-uuid', {
        include: [Country],
      });
    });
  });

  describe('create', () => {
    const createDto: CreateDatacenterDto = {
      code: 'VA-ASH-1',
      name: 'Ashburn Corporate Center 1',
      city: 'Ashburn',
      countryId: 'country-uuid',
    };

    it('should successfully create and reload an event if inputs are unique and country exists', async () => {
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'dc-uuid', ...createDto });
      mockDatacenterModel.findOne.mockResolvedValue(null); // No code collision
      mockCountryModel.findByPk.mockResolvedValue({ id: 'country-uuid' }); // Country exists
      mockDatacenterModel.create.mockResolvedValue({
        id: 'dc-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockDatacenterModel.create).toHaveBeenCalledWith(createDto);
      expect(mockCountryModel.findByPk).toHaveBeenCalledWith('country-uuid');
      expect(mockReload).toHaveBeenCalledWith({ include: [Country] });
    });

    it('should throw ConflictException if facility code already exists', async () => {
      mockDatacenterModel.findOne.mockResolvedValue({
        id: 'existing-id',
        code: 'VA-ASH-1',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDatacenterModel.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the provided countryId does not exist', async () => {
      mockDatacenterModel.findOne.mockResolvedValue(null);
      mockCountryModel.findByPk.mockResolvedValue(null); // Country missing

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Country with ID country-uuid not found'),
      );
      expect(mockDatacenterModel.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdateDatacenterDto = {
      name: 'Ashburn CC 1 Optimized',
      countryId: 'new-country-uuid',
    };

    it('should successfully update a datacenter when target items are valid and exist', async () => {
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'dc-uuid', name: 'Ashburn CC 1 Optimized' });
      const mockInstance = {
        id: 'dc-uuid',
        managed: false,
        update: jest.fn().mockResolvedValue(true),
        reload: mockReload,
      };
      mockDatacenterModel.findByPk.mockResolvedValue(mockInstance);
      mockDatacenterModel.findOne.mockResolvedValue(null); // No code naming conflict
      mockCountryModel.findByPk.mockResolvedValue({ id: 'new-country-uuid' }); // New country exists

      await service.update('dc-uuid', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ashburn CC 1 Optimized',
          countryId: 'new-country-uuid',
        }),
      );
      expect(mockReload).toHaveBeenCalledWith({ include: [Country] });
    });

    it('should throw NotFoundException if the updated countryId does not exist', async () => {
      const mockInstance = { id: 'dc-uuid', managed: false };
      mockDatacenterModel.findByPk.mockResolvedValue(mockInstance);
      mockDatacenterModel.findOne.mockResolvedValue(null);
      mockCountryModel.findByPk.mockResolvedValue(null); // Country missing

      await expect(service.update('dc-uuid', updateDto)).rejects.toThrow(
        new NotFoundException('Country with ID new-country-uuid not found'),
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a datacenter if it is not managed', async () => {
      const mockInstance = { id: 'dc-uuid', managed: false };
      mockDatacenterModel.findByPk.mockResolvedValue(mockInstance);
      mockDatacenterModel.destroy.mockResolvedValue(1);

      const result = await service.delete('dc-uuid');

      expect(result).toBe(true);
      expect(mockDatacenterModel.destroy).toHaveBeenCalledWith({
        where: { id: 'dc-uuid' },
      });
    });
  });
});
