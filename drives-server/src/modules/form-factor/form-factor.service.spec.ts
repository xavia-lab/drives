import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FormFactorService } from './form-factor.service';
import { FormFactor } from './entities/form-factor.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateFormFactorDto } from './dto/create-form-factor.dto';
import { UpdateFormFactorDto } from './dto/update-form-factor.dto';

describe('FormFactorService', () => {
  let service: FormFactorService;
  let mockFormFactorModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock the Sequelize Model Static Methods
    mockFormFactorModel = {
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
        FormFactorService,
        {
          provide: getModelToken(FormFactor),
          useValue: mockFormFactorModel,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<FormFactorService>(FormFactorService);
    jest.clearAllMocks();
  });

  describe('createFormFactor', () => {
    const createDto: CreateFormFactorDto = { name: 'M.2 2280', slotPitch: 0.5 };

    it('should successfully create a form factor if the name is unique', async () => {
      mockFormFactorModel.findOne.mockResolvedValue(null); // No naming collision
      mockFormFactorModel.create.mockResolvedValue({
        id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
        ...createDto,
      });

      const result = await service.createFormFactor(createDto);

      expect(result).toBeDefined();
      expect(mockFormFactorModel.create).toHaveBeenCalledWith({ ...createDto });
    });

    it('should throw ConflictException if form factor name already exists', async () => {
      mockFormFactorModel.findOne.mockResolvedValue({
        id: 'existing-id',
        name: 'M.2 2280',
      });

      await expect(service.createFormFactor(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockFormFactorModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateFormFactor', () => {
    const updateDto: UpdateFormFactorDto = { name: 'U.2 2.5"', slotPitch: 0.8 };

    it('should successfully update a non-managed form factor', async () => {
      const mockInstance = {
        id: 'uuid-1',
        managed: false,
        update: jest.fn().mockResolvedValue({
          id: 'uuid-1',
          name: 'U.2 2.5"',
          slotPitch: 0.8,
        }),
      };
      mockFormFactorModel.findByPk.mockResolvedValue(mockInstance);
      mockFormFactorModel.findOne.mockResolvedValue(null); // No renaming conflict

      await service.updateFormFactor('uuid-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'U.2 2.5"', slotPitch: 0.8 }),
      );
    });

    it('should throw ConflictException when trying to update a system-managed form factor', async () => {
      const mockInstance = { id: 'uuid-1', managed: true };
      mockFormFactorModel.findByPk.mockResolvedValue(mockInstance);

      await expect(
        service.updateFormFactor('uuid-1', updateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteFormFactor', () => {
    it('should successfully delete a form factor if it is not managed', async () => {
      const mockInstance = { id: 'uuid-1', managed: false };
      mockFormFactorModel.findByPk.mockResolvedValue(mockInstance);
      mockFormFactorModel.destroy.mockResolvedValue(1); // 1 row removed

      const result = await service.deleteFormFactor('uuid-1');

      expect(result).toBe(true);
      expect(mockFormFactorModel.destroy).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException if form factor to delete does not exist', async () => {
      mockFormFactorModel.findByPk.mockResolvedValue(null);

      await expect(service.deleteFormFactor('invalid-id')).rejects.toThrow(
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
        mockFormFactorModel,
        mockQuery,
      );
    });
  });
});
