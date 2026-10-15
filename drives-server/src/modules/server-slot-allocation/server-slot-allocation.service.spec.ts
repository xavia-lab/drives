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
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('ServerSlotAllocationService', () => {
  let service: ServerSlotAllocationService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockAllocationModel: Record<string, Mock>;
  let mockServerSlotModel: Record<string, Mock>;
  let mockPhysicalDriveModel: Record<string, Mock>;
  let mockUserModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockAllocationModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockServerSlotModel = { findByPk: vi.fn() };
    mockPhysicalDriveModel = { findByPk: vi.fn() };
    mockUserModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

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
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: (ServerSlotAllocation & { itemNumber: number })[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockAllocationModel as unknown,
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
      const mockReload = vi
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

    it('should throw an aggregated multiline NotFoundException if multiple foreign keys are missing', async () => {
      mockServerSlotModel.findByPk.mockResolvedValue(null);
      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'drive-uuid' });
      mockUserModel.findByPk.mockResolvedValue(null);

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
