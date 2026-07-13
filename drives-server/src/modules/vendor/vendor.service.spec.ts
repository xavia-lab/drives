import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { Vendor } from './entities/vendor.entity';
import { Country } from '../country/entities/country.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

describe('VendorService', () => {
  let service: VendorService;
  let mockVendorModel: any;
  let mockCountryModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock both Sequelize models
    mockVendorModel = {
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
        VendorService,
        {
          provide: getModelToken(Vendor),
          useValue: mockVendorModel,
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

    service = module.get<VendorService>(VendorService);
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
        mockVendorModel,
        mockQuery,
      );
    });
  });

  describe('findOne', () => {
    it('should successfully find and return a vendor by ID', async () => {
      const mockVendor = { id: 'uuid-1', name: 'Vendor Tech' };
      mockVendorModel.findByPk.mockResolvedValue(mockVendor);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(mockVendor);
      expect(mockVendorModel.findByPk).toHaveBeenCalledWith('uuid-1');
    });

    it('should throw NotFoundException if vendor is not found', async () => {
      mockVendorModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto: CreateVendorDto = {
      name: 'Vendor Tech',
      countryId: 'country-uuid',
      isManufacturer: true,
      isRetailer: false,
    };

    it('should successfully create and reload a vendor if inputs are valid and unique', async () => {
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'uuid-1', ...createDto });
      mockVendorModel.findOne.mockResolvedValue(null); // No name collision
      mockCountryModel.findByPk.mockResolvedValue({ id: 'country-uuid' }); // Country exists
      mockVendorModel.create.mockResolvedValue({
        id: 'uuid-1',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockVendorModel.create).toHaveBeenCalledWith({ ...createDto });
      expect(mockCountryModel.findByPk).toHaveBeenCalledWith('country-uuid');
      expect(mockReload).toHaveBeenCalled();
    });

    it('should throw ConflictException if vendor name already exists', async () => {
      mockVendorModel.findOne.mockResolvedValue({
        id: 'existing-id',
        name: 'Vendor Tech',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockVendorModel.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if countryId is missing', async () => {
      mockVendorModel.findOne.mockResolvedValue(null);
      const invalidDto = { name: 'Vendor Tech' } as CreateVendorDto;

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if the provided countryId does not exist', async () => {
      mockVendorModel.findOne.mockResolvedValue(null);
      mockCountryModel.findByPk.mockResolvedValue(null); // Country does not exist

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Country with ID country-uuid not found'),
      );
      expect(mockVendorModel.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdateVendorDto = {
      name: 'Updated Vendor Tech',
      countryId: 'new-country-uuid',
    };

    it('should successfully update a non-managed vendor and reload with country criteria', async () => {
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'uuid-1', name: 'Updated Vendor Tech' });
      const mockInstance = {
        id: 'uuid-1',
        managed: false,
        update: jest.fn().mockResolvedValue(true),
        reload: mockReload,
      };
      mockVendorModel.findByPk.mockResolvedValue(mockInstance);
      mockVendorModel.findOne.mockResolvedValue(null); // No renaming collision
      mockCountryModel.findByPk.mockResolvedValue({ id: 'new-country-uuid' }); // Country exists

      await service.update('uuid-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Vendor Tech',
          countryId: 'new-country-uuid',
        }),
      );
      expect(mockReload).toHaveBeenCalledWith({ include: [Country] });
    });

    it('should throw NotFoundException if the updated countryId does not exist', async () => {
      const mockInstance = { id: 'uuid-1', managed: false };
      mockVendorModel.findByPk.mockResolvedValue(mockInstance);
      mockVendorModel.findOne.mockResolvedValue(null);
      mockCountryModel.findByPk.mockResolvedValue(null); // Country does not exist

      await expect(service.update('uuid-1', updateDto)).rejects.toThrow(
        new NotFoundException('Country with ID new-country-uuid not found'),
      );
    });

    it('should throw ConflictException when trying to update a system-managed vendor', async () => {
      const mockInstance = { id: 'uuid-1', managed: true };
      mockVendorModel.findByPk.mockResolvedValue(mockInstance);

      await expect(service.update('uuid-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a vendor if it is not managed', async () => {
      const mockInstance = { id: 'uuid-1', managed: false };
      mockVendorModel.findByPk.mockResolvedValue(mockInstance);
      mockVendorModel.destroy.mockResolvedValue(1); // 1 row removed

      const result = await service.delete('uuid-1');

      expect(result).toBe(true);
      expect(mockVendorModel.destroy).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw ConflictException when trying to delete a system-managed vendor', async () => {
      const mockInstance = { id: 'uuid-1', managed: true };
      mockVendorModel.findByPk.mockResolvedValue(mockInstance);

      await expect(service.delete('uuid-1')).rejects.toThrow(ConflictException);
      expect(mockVendorModel.destroy).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if vendor to delete does not exist', async () => {
      mockVendorModel.findByPk.mockResolvedValue(null);

      await expect(service.delete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
