import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common';
import { WarrantyClaimService } from './warranty-claim.service';
import {
  WarrantyClaim,
  WarrantyClaimStatus,
} from './entities/warranty-claim.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { DriveLifecycleEvent } from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';
import { UpdateWarrantyClaimDto } from './dto/update-warranty-claim.dto';

describe('WarrantyClaimService', () => {
  let service: WarrantyClaimService;
  let mockWarrantyClaimModel: any;
  let mockPhysicalDriveModel: any;
  let mockEventModel: any;
  let mockVendorModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockWarrantyClaimModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockPhysicalDriveModel = { findByPk: jest.fn() };
    mockEventModel = { findByPk: jest.fn() };
    mockVendorModel = { findByPk: jest.fn() };
    mockPaginationService = { paginate: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarrantyClaimService,
        {
          provide: getModelToken(WarrantyClaim),
          useValue: mockWarrantyClaimModel,
        },
        {
          provide: getModelToken(PhysicalDrive),
          useValue: mockPhysicalDriveModel,
        },
        {
          provide: getModelToken(DriveLifecycleEvent),
          useValue: mockEventModel,
        },
        { provide: getModelToken(Vendor), useValue: mockVendorModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<WarrantyClaimService>(WarrantyClaimService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockWarrantyClaimModel,
        mockQuery,
      );
    });
  });

  describe('create', () => {
    const createDto: CreateWarrantyClaimDto = {
      physicalDriveId: 'drive-uuid',
      triggeringEventId: 'event-uuid',
      handledByVendorId: 'vendor-uuid',
      rmaTrackingNumber: 'RMA123456',
      claimStatus: WarrantyClaimStatus.SUBMITTED,
      notes: 'Drive failing SMART test',
    };

    it('should create and reload a warranty claim if all foreign keys exist', async () => {
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'claim-uuid', ...createDto });
      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'drive-uuid' });
      mockEventModel.findByPk.mockResolvedValue({ id: 'event-uuid' });
      mockVendorModel.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockWarrantyClaimModel.create.mockResolvedValue({
        id: 'claim-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockWarrantyClaimModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({
        include: [PhysicalDrive, DriveLifecycleEvent, Vendor],
      });
    });

    it('should aggregate multiple missing foreign keys into a single multiline NotFoundException', async () => {
      mockPhysicalDriveModel.findByPk.mockResolvedValue(null); // Missing
      mockEventModel.findByPk.mockResolvedValue({ id: 'event-uuid' });
      mockVendorModel.findByPk.mockResolvedValue(null); // Missing

      const expectedErrorMessage = [
        'PhysicalDrive with ID drive-uuid not found',
        'Vendor with ID vendor-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateWarrantyClaimDto = {
      claimStatus: WarrantyClaimStatus.APPROVED,
      handledByVendorId: 'missing-vendor-uuid',
    };

    it('should throw NotFoundException if updated foreign key is not found', async () => {
      const mockInstance = { id: 'claim-uuid' };
      mockWarrantyClaimModel.findByPk.mockResolvedValue(mockInstance);
      mockVendorModel.findByPk.mockResolvedValue(null); // Missing

      await expect(service.update('claim-uuid', updateDto)).rejects.toThrow(
        new NotFoundException('Vendor with ID missing-vendor-uuid not found'),
      );
    });
  });
});
