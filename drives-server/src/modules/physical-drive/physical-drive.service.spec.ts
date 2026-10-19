import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { PhysicalDriveLocation } from './entities/physical-drive-location.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { ServerSlotAllocationService } from '../server-slot-allocation/server-slot-allocation.service';
import { CreatePhysicalDriveDto } from './dto/create-physical-drive.dto';
import { UpdatePhysicalDriveDto } from './dto/update-physical-drive.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('PhysicalDriveService', () => {
  let service: PhysicalDriveService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockPhysicalDriveRepo: Record<string, Mock>;
  let mockLocationRepo: Record<string, Mock>;
  let mockDriveModelRepo: Record<string, Mock>;
  let mockVendorRepo: Record<string, Mock>;
  let mockCurrencyRepo: Record<string, Mock>;
  let mockDatacenterRepo: Record<string, Mock>;
  let mockSequelize: { transaction: Mock };
  let mockPaginationService: Mocked<PaginationService>;
  let mockAllocationService: { getCurrentAssignmentsForDrives: Mock };

  const mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };

  beforeEach(async () => {
    // 1. Mock all required Sequelize models using vi.fn()
    mockPhysicalDriveRepo = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockLocationRepo = {
      findOne: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
    };
    mockDriveModelRepo = { findByPk: vi.fn() };
    mockVendorRepo = { findByPk: vi.fn() };
    mockCurrencyRepo = { findByPk: vi.fn() };
    mockDatacenterRepo = { findByPk: vi.fn() };

    // 2. Transaction runner simply executes the callback with a fake tx object
    mockSequelize = {
      transaction: vi.fn((callback: (t: unknown) => unknown) =>
        callback(mockTransaction),
      ),
    };

    // 3. Mock the PaginationService using clear type boundaries
    mockPaginationService = {
      paginate: vi.fn(),
    };

    mockAllocationService = {
      getCurrentAssignmentsForDrives: vi.fn(() => Promise.resolve(new Map())),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalDriveService,
        {
          provide: getModelToken(PhysicalDrive),
          useValue: mockPhysicalDriveRepo,
        },
        {
          provide: getModelToken(PhysicalDriveLocation),
          useValue: mockLocationRepo,
        },
        {
          provide: getModelToken(DriveModel),
          useValue: mockDriveModelRepo,
        },
        { provide: getModelToken(Vendor), useValue: mockVendorRepo },
        { provide: getModelToken(Currency), useValue: mockCurrencyRepo },
        { provide: getModelToken(Datacenter), useValue: mockDatacenterRepo },
        { provide: getConnectionToken(), useValue: mockSequelize },
        { provide: PaginationService, useValue: mockPaginationService },
        {
          provide: ServerSlotAllocationService,
          useValue: mockAllocationService,
        },
      ],
    }).compile();

    service = module.get<PhysicalDriveService>(PhysicalDriveService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedOutput = { data: [], meta: {} } as unknown as {
        data: PhysicalDrive[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockPhysicalDriveRepo as unknown,
        mockQuery,
        { where: {} },
      );
    });

    it('should attach the derived currentLocation to each listed drive', async () => {
      const drive = { id: 'drive-1', setDataValue: vi.fn() };
      mockPaginationService.paginate.mockResolvedValue({
        data: [drive],
        meta: {},
      });
      mockLocationRepo.findAll.mockResolvedValue([
        {
          physicalDriveId: 'drive-1',
          datacenterId: 'dc-1',
          id: 'loc-1',
          locatedAt: new Date('2026-07-01T09:00:00.000Z'),
          notes: null,
          datacenter: { code: 'VA-ASH-1', name: 'Ashburn Data Center 1' },
        },
      ]);

      await service.findAll({ pageNumber: 1, pageSize: 10 });

      expect(drive.setDataValue).toHaveBeenCalledWith(
        'currentLocation',
        expect.objectContaining({ datacenterId: 'dc-1', code: 'VA-ASH-1' }),
      );
    });

    it('should translate a currentLocation filter into an id IN clause', async () => {
      // 1st: candidate drives in the datacenter, 2nd: their derived current
      // locations, then default [] for the post-pagination decoration lookup.
      mockLocationRepo.findAll
        .mockResolvedValueOnce([{ physicalDriveId: 'drive-1' }])
        .mockResolvedValueOnce([
          {
            physicalDriveId: 'drive-1',
            datacenterId: 'dc-1',
            id: 'loc-1',
            locatedAt: new Date('2026-07-01T09:00:00.000Z'),
            notes: null,
            datacenter: { code: 'VA-ASH-1', name: 'Ashburn Data Center 1' },
          },
        ])
        .mockResolvedValue([]);
      mockPaginationService.paginate.mockResolvedValue({
        data: [],
        meta: {},
      });

      await service.findAll({
        pageNumber: 1,
        pageSize: 10,
        filterField: 'currentLocation',
        filterOperator: 'in',
        filterValue: 'dc-1',
      });

      expect(mockLocationRepo.findAll).toHaveBeenCalledWith({
        where: { datacenterId: { [Op.in]: ['dc-1'] } },
        attributes: ['physicalDriveId'],
      });

      const call = mockPaginationService.paginate.mock.calls[0];
      expect(call[1]?.filterField).toBeUndefined();
      expect(call[2]?.where?.id).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should successfully find and return a physical drive by ID', async () => {
      const mockDrive = {
        id: 'drive-1',
        serialNumber: 'S3X0NX0A123456',
        locations: [],
        setDataValue: vi.fn(),
      };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockDrive);

      const result = await service.findOne('drive-1');

      expect(result).toEqual(mockDrive);
      expect(mockPhysicalDriveRepo.findByPk).toHaveBeenCalledWith('drive-1', {
        include: [
          {
            model: PhysicalDriveLocation,
            as: 'locations',
            include: [Datacenter],
          },
        ],
      });
      expect(mockDrive.setDataValue).toHaveBeenCalledWith('locations', []);
      expect(mockDrive.setDataValue).toHaveBeenCalledWith(
        'currentLocation',
        null,
      );
    });

    it('should return null when the drive does not exist', async () => {
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(null);

      const result = await service.findOne('missing');

      expect(result).toBeNull();
    });

    it('should attach the derived currentAssignment when the drive is seated', async () => {
      const mockDrive = {
        id: 'drive-1',
        locations: [],
        setDataValue: vi.fn(),
      };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockDrive);
      mockAllocationService.getCurrentAssignmentsForDrives.mockResolvedValue(
        new Map([
          [
            'drive-1',
            {
              allocationId: 'alloc-1',
              slotId: 'slot-1',
              slotLabel: 'Bay 0',
              serverId: 'server-1',
              serverHostname: 'ash-compute-01',
              assignedAt: new Date(),
            },
          ],
        ]),
      );

      await service.findOne('drive-1');

      expect(mockDrive.setDataValue).toHaveBeenCalledWith(
        'currentAssignment',
        expect.objectContaining({
          serverId: 'server-1',
          slotLabel: 'Bay 0',
        }),
      );
    });
  });

  describe('create', () => {
    const createDto: CreatePhysicalDriveDto = {
      serialNumber: 'S3X0NX0A123456',
      worldwideNameWwn: 'wwn-12345',
      acquisitionCost: 150.0,
      purchaseDate: '2026-01-01',
      warrantyExpiryDate: '2031-01-01',
      driveModelId: 'sm-uuid',
      retailerVendorId: 'vendor-uuid',
      currencyId: 'currency-uuid',
    };

    it('should successfully create a physical drive when serial number is unique and all keys exist', async () => {
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null);
      mockDriveModelRepo.findByPk.mockResolvedValue({ id: 'sm-uuid' });
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockCurrencyRepo.findByPk.mockResolvedValue({ id: 'currency-uuid' });
      mockPhysicalDriveRepo.create.mockResolvedValue({
        id: 'drive-1',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockPhysicalDriveRepo.create).toHaveBeenCalledWith({
        ...createDto,
      });
    });

    it('should throw ConflictException if the serial number already exists', async () => {
      mockPhysicalDriveRepo.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPhysicalDriveRepo.create).not.toHaveBeenCalled();
    });

    it('should aggregate multiple non-existent foreign keys into a single multiline NotFoundException', async () => {
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null);
      mockDriveModelRepo.findByPk.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockCurrencyRepo.findByPk.mockResolvedValue(null);

      const expectedErrorMessage = [
        'DriveModel with ID sm-uuid not found',
        'Currency with ID currency-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
      expect(mockPhysicalDriveRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdatePhysicalDriveDto = {
      serialNumber: 'NEW-SERIAL-123',
      retailerVendorId: 'missing-vendor-uuid',
    };

    it('should successfully update field variables if inputs are unique and exist', async () => {
      const mockInstance = {
        id: 'drive-1',
        serialNumber: 'S3X0NX0A123456',
        update: vi.fn().mockResolvedValue(true),
      };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'missing-vendor-uuid' });

      await service.update('drive-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          serialNumber: 'NEW-SERIAL-123',
          retailerVendorId: 'missing-vendor-uuid',
        }),
      );
    });

    it('should throw a combined exception if updated foreign keys are missing', async () => {
      const mockInstance = { id: 'drive-1', serialNumber: 'S3X0NX0A123456' };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue(null);

      await expect(service.update('drive-1', updateDto)).rejects.toThrow(
        new NotFoundException(
          'Retailer Vendor with ID missing-vendor-uuid not found',
        ),
      );
    });
  });

  describe('recordLocation', () => {
    const locationDto = { datacenterId: 'dc-1' };

    const driveWithLocations = () => ({
      id: 'drive-1',
      locations: [],
      setDataValue: vi.fn(),
    });

    it('should append a location event and return the drive with its timeline', async () => {
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(driveWithLocations());
      mockDatacenterRepo.findByPk.mockResolvedValue({ id: 'dc-1' });
      mockLocationRepo.findOne.mockResolvedValue(null);
      mockLocationRepo.create.mockResolvedValue({ id: 'loc-1' });

      await service.recordLocation('drive-1', locationDto);

      expect(mockLocationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          physicalDriveId: 'drive-1',
          datacenterId: 'dc-1',
        }),
        { transaction: mockTransaction },
      );
    });

    it('should throw NotFoundException when the drive does not exist', async () => {
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(null);

      await expect(
        service.recordLocation('missing', locationDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockLocationRepo.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the datacenter does not exist', async () => {
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(driveWithLocations());
      mockDatacenterRepo.findByPk.mockResolvedValue(null);

      await expect(
        service.recordLocation('drive-1', locationDto),
      ).rejects.toThrow(
        new NotFoundException('Datacenter with ID dc-1 not found'),
      );
      expect(mockLocationRepo.create).not.toHaveBeenCalled();
    });

    it('should reject re-recording the currently-assigned datacenter', async () => {
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(driveWithLocations());
      mockDatacenterRepo.findByPk.mockResolvedValue({ id: 'dc-1' });
      mockLocationRepo.findOne.mockResolvedValue({ datacenterId: 'dc-1' });

      await expect(
        service.recordLocation('drive-1', locationDto),
      ).rejects.toThrow(ConflictException);
      expect(mockLocationRepo.create).not.toHaveBeenCalled();
    });

    it('should append when moving to a different datacenter', async () => {
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(driveWithLocations());
      mockDatacenterRepo.findByPk.mockResolvedValue({ id: 'dc-2' });
      mockLocationRepo.findOne.mockResolvedValue({ datacenterId: 'dc-1' });
      mockLocationRepo.create.mockResolvedValue({ id: 'loc-2' });

      await service.recordLocation('drive-1', { datacenterId: 'dc-2' });

      expect(mockLocationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ datacenterId: 'dc-2' }),
        { transaction: mockTransaction },
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a physical drive if it is found', async () => {
      const mockInstance = { id: 'drive-1' };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveRepo.destroy.mockResolvedValue(1);

      const result = await service.delete('drive-1');

      expect(result).toBe(true);
      expect(mockPhysicalDriveRepo.destroy).toHaveBeenCalledWith({
        where: { id: 'drive-1' },
      });
    });

    it('should throw NotFoundException if the drive to delete is missing', async () => {
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(null);

      await expect(service.delete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
