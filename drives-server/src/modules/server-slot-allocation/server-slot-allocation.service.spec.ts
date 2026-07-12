import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common';
import { ServerSlotAllocationService } from './server-slot-allocation.service';
import {
  ServerSlotAllocation,
  ServerSlotActionType,
} from './entities/server-slot-allocation.entity';
import { ServerSlot } from '../server-slot/entities/server-slot.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { User } from '../user/entities/user.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateServerSlotAllocationDto } from './dto/create-server-slot-allocation.dto';
import { UpdateServerSlotAllocationDto } from './dto/update-server-slot-allocation.dto';

describe('ServerSlotAllocationService', () => {
  let service: ServerSlotAllocationService;
  let mockAllocationModel: any;
  let mockServerSlotModel: any;
  let mockPhysicalDriveModel: any;
  let mockUserModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockAllocationModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockServerSlotModel = { findByPk: jest.fn() };
    mockPhysicalDriveModel = { findByPk: jest.fn() };
    mockUserModel = { findByPk: jest.fn() };
    mockPaginationService = { paginate: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerSlotAllocationService,
        {
          provide: getModelToken(ServerSlotAllocation),
          useValue: mockAllocationModel,
        },
        { provide: getModelToken(ServerSlot), useValue: mockServerSlotModel },
        {
          provide: getModelToken(PhysicalDrive),
          useValue: mockPhysicalDriveModel,
        },
        { provide: getModelToken(User), useValue: mockUserModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<ServerSlotAllocationService>(
      ServerSlotAllocationService,
    );
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockAllocationModel,
        mockQuery,
        { include: [ServerSlot, PhysicalDrive, User] },
      );
    });
  });

  describe('create', () => {
    const createDto: CreateServerSlotAllocationDto = {
      actionType: ServerSlotActionType.MOUNT,
      serverSlotId: 'slot-uuid',
      physicalDriveId: 'drive-uuid',
      userId: 'user-uuid',
      timestamp: '2026-07-13T05:01:22.000Z',
    };

    it('should successfully create and reload an allocation record if all parents exist', async () => {
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'alloc-uuid', ...createDto });
      mockServerSlotModel.findByPk.mockResolvedValue({ id: 'slot-uuid' });
      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'drive-uuid' });
      mockUserModel.findByPk.mockResolvedValue({ id: 'user-uuid' });
      mockAllocationModel.create.mockResolvedValue({
        id: 'alloc-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockAllocationModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({
        include: [ServerSlot, PhysicalDrive, User],
      });
    });

    it('should aggregate multiple missing parent foreign keys into a single multiline NotFoundException', async () => {
      mockServerSlotModel.findByPk.mockResolvedValue(null); // Missing
      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'drive-uuid' }); // Exists
      mockUserModel.findByPk.mockResolvedValue(null); // Missing

      const expectedErrorMessage = [
        'ServerSlot with ID slot-uuid not found',
        'User with ID user-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });
});
