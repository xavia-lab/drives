import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ServerSlotAllocationService } from './server-slot-allocation.service';
import type { SlotAssignmentBoard } from './server-slot-allocation.service';
import {
  ServerSlotAllocation,
  ServerSlotActionType,
} from './entities/server-slot-allocation.entity';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PhysicalDriveLocation } from '../physical-drive/entities/physical-drive-location.entity';
import { Rack } from '../rack/entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

describe('ServerSlotAllocationService', () => {
  let service: ServerSlotAllocationService;

  let mockAllocationModel: Record<string, Mock>;
  let mockServerSlotModel: Record<string, Mock>;
  let mockPhysicalServerModel: Record<string, Mock>;
  let mockPhysicalDriveModel: Record<string, Mock>;
  let mockLocationModel: Record<string, Mock>;
  let mockPaginationService: { paginate: Mock };
  let mockTransaction: { LOCK: { UPDATE: string } };
  let mockSequelize: { transaction: Mock };

  const serverRecord = {
    id: 'server-1',
    hostname: 'ash-compute-01',
    rackId: 'rack-1',
    rack: {
      id: 'rack-1',
      name: 'RACK-A01',
      datacenter: {
        id: 'dc-1',
        code: 'VA-ASH-1',
        name: 'Ashburn Data Center 1',
      },
    },
  };

  beforeEach(async () => {
    mockAllocationModel = {
      findAll: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
    };
    mockServerSlotModel = { findAll: vi.fn(), findByPk: vi.fn() };
    mockPhysicalServerModel = { findByPk: vi.fn() };
    mockPhysicalDriveModel = { findAll: vi.fn(), findByPk: vi.fn() };
    mockLocationModel = { findAll: vi.fn() };
    mockPaginationService = { paginate: vi.fn() };

    mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };
    mockSequelize = {
      transaction: vi.fn((cb: (t: unknown) => unknown) =>
        Promise.resolve(cb(mockTransaction)),
      ),
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
          provide: getModelToken(PhysicalServer),
          useValue: mockPhysicalServerModel,
        },
        {
          provide: getModelToken(PhysicalDrive),
          useValue: mockPhysicalDriveModel,
        },
        {
          provide: getModelToken(PhysicalDriveLocation),
          useValue: mockLocationModel,
        },
        { provide: getModelToken(Rack), useValue: {} },
        { provide: getModelToken(Datacenter), useValue: {} },
        { provide: PaginationService, useValue: mockPaginationService },
        { provide: getConnectionToken(), useValue: mockSequelize },
      ],
    }).compile();

    service = module.get<ServerSlotAllocationService>(
      ServerSlotAllocationService,
    );
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates to the pagination service with the ledger relations', async () => {
      const paginated = {
        data: [],
        meta: {},
      } as PaginatedResponse<ServerSlotAllocation>;
      mockPaginationService.paginate.mockResolvedValue(paginated);

      const result = await service.findAll({ pageNumber: 1, pageSize: 10 });

      expect(result).toBe(paginated);
      const [modelArg, queryArg, optionsArg] = mockPaginationService.paginate
        .mock.calls[0] as unknown as [unknown, unknown, { include: unknown[] }];
      expect(modelArg).toBe(mockAllocationModel);
      expect(queryArg).toEqual({ pageNumber: 1, pageSize: 10 });
      expect(Array.isArray(optionsArg.include)).toBe(true);
    });
  });

  describe('getBoard', () => {
    it('returns slots with derived occupancy and the datacenter free drives', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue(serverRecord);
      mockServerSlotModel.findAll.mockResolvedValue([
        {
          id: 'slot-1',
          slotLabel: 'Bay 0',
          pcieBusAddress: '0000:41:00.0',
          supportedInterfaceId: 'if-1',
        },
        {
          id: 'slot-2',
          slotLabel: 'Bay 1',
          pcieBusAddress: null,
          supportedInterfaceId: 'if-1',
        },
      ]);
      // 1st allocation lookup derives slot occupancy (drive d1 seated in slot-1)
      mockAllocationModel.findAll
        .mockResolvedValueOnce([
          {
            id: 'alloc-1',
            serverSlotId: 'slot-1',
            physicalDriveId: 'd1',
            actionType: ServerSlotActionType.MOUNT,
            timestamp: new Date('2026-07-10T00:00:00Z'),
          },
        ])
        // 2nd allocation lookup derives which drives are free (d2 has no MOUNT)
        .mockResolvedValueOnce([]);
      mockPhysicalDriveModel.findAll
        .mockResolvedValueOnce([
          {
            id: 'd1',
            label: 'SA-1',
            serialNumber: 'SN-1',
            driveModelId: 'dm-1',
            driveModel: { name: 'Samsung PM9A3' },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'd2',
            label: 'SA-2',
            serialNumber: 'SN-2',
            driveModelId: 'dm-1',
            driveModel: { name: 'Samsung PM9A3' },
          },
        ]);
      mockLocationModel.findAll.mockResolvedValue([
        {
          physicalDriveId: 'd2',
          datacenterId: 'dc-1',
          locatedAt: new Date('2026-07-01T00:00:00Z'),
          displayKey: 1,
        },
      ]);

      const board = await service.getBoard('server-1');

      expect(board.server.datacenterCode).toBe('VA-ASH-1');
      expect(board.slots).toHaveLength(2);
      expect(board.slots[0].occupancy?.physicalDriveId).toBe('d1');
      expect(board.slots[1].occupancy).toBeNull();
      expect(board.freeDrives.map((d) => d.id)).toEqual(['d2']);
      expect(board.summary).toEqual({
        totalSlots: 2,
        occupiedSlots: 1,
        emptySlots: 1,
        freeDrives: 1,
      });
    });

    it('throws NotFound when the server does not exist', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue(null);

      await expect(service.getBoard('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('mount', () => {
    it('rejects a slot that does not belong to the addressed server', async () => {
      mockServerSlotModel.findByPk.mockResolvedValue({
        id: 'slot-1',
        serverId: 'other-server',
      });

      await expect(
        service.mount('server-1', 'slot-1', 'd1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAllocationModel.create).not.toHaveBeenCalled();
    });

    it('rejects a drive located in a different datacenter', async () => {
      mockServerSlotModel.findByPk.mockResolvedValue({
        id: 'slot-1',
        serverId: 'server-1',
      });
      mockPhysicalServerModel.findByPk.mockResolvedValue(serverRecord);
      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'd1' });
      mockLocationModel.findAll.mockResolvedValue([
        {
          physicalDriveId: 'd1',
          datacenterId: 'dc-2',
          locatedAt: new Date(),
          displayKey: 1,
        },
      ]);

      await expect(
        service.mount('server-1', 'slot-1', 'd1', 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(mockAllocationModel.create).not.toHaveBeenCalled();
    });

    it('appends UNMOUNT for the old slot then MOUNT when moving a drive', async () => {
      mockServerSlotModel.findByPk.mockResolvedValue({
        id: 'slot-2',
        serverId: 'server-1',
      });
      mockPhysicalServerModel.findByPk.mockResolvedValue(serverRecord);
      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'd1' });
      mockLocationModel.findAll
        // drive's current location used by the datacenter guard
        .mockResolvedValueOnce([
          {
            physicalDriveId: 'd1',
            datacenterId: 'dc-1',
            locatedAt: new Date(),
            displayKey: 1,
          },
        ])
        // getBoard free-drive lookup (no locations)
        .mockResolvedValueOnce([]);
      // getBoard after the write
      mockServerSlotModel.findAll.mockResolvedValue([]);
      mockAllocationModel.create.mockResolvedValue({ id: 'alloc' });
      mockAllocationModel.findAll
        // slot occupancy lookup (slot-2 currently has no event)
        .mockResolvedValueOnce([])
        // drive latest event -> MOUNT in slot-1
        .mockResolvedValueOnce([
          {
            id: 'alloc-old',
            serverSlotId: 'slot-1',
            physicalDriveId: 'd1',
            actionType: ServerSlotActionType.MOUNT,
            timestamp: new Date('2026-07-01T00:00:00Z'),
          },
        ]);

      await service.mount('server-1', 'slot-2', 'd1', 'user-1');

      const createCalls = mockAllocationModel.create.mock.calls as unknown as [
        { actionType: ServerSlotActionType },
      ][];
      const actions = createCalls.map((call) => call[0].actionType);
      expect(actions).toEqual([
        ServerSlotActionType.UNMOUNT,
        ServerSlotActionType.MOUNT,
      ]);
    });
  });

  describe('unmount', () => {
    it('rejects a slot that currently holds no drive', async () => {
      mockServerSlotModel.findByPk.mockResolvedValue({
        id: 'slot-1',
        serverId: 'server-1',
      });
      mockAllocationModel.findAll.mockResolvedValue([]);

      await expect(
        service.unmount('server-1', 'slot-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(mockAllocationModel.create).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentAssignmentsForDrives', () => {
    it('derives the server and slot for a seated drive', async () => {
      mockAllocationModel.findAll.mockResolvedValue([
        {
          id: 'alloc-1',
          serverSlotId: 'slot-1',
          physicalDriveId: 'd1',
          actionType: ServerSlotActionType.MOUNT,
          timestamp: new Date('2026-07-01T00:00:00Z'),
        },
      ]);
      mockServerSlotModel.findAll.mockResolvedValue([
        {
          id: 'slot-1',
          slotLabel: 'Bay 0',
          serverId: 'server-1',
          server: { id: 'server-1', hostname: 'ash-compute-01' },
        },
      ]);

      const map = await service.getCurrentAssignmentsForDrives(['d1']);

      expect(map.get('d1')).toMatchObject({
        allocationId: 'alloc-1',
        slotId: 'slot-1',
        slotLabel: 'Bay 0',
        serverId: 'server-1',
        serverHostname: 'ash-compute-01',
      });
    });

    it('omits drives whose latest event is an unmount', async () => {
      mockAllocationModel.findAll.mockResolvedValue([
        {
          id: 'alloc-1',
          serverSlotId: 'slot-1',
          physicalDriveId: 'd1',
          actionType: ServerSlotActionType.UNMOUNT,
          timestamp: new Date('2026-07-01T00:00:00Z'),
        },
      ]);

      const map = await service.getCurrentAssignmentsForDrives(['d1']);

      expect(map.has('d1')).toBe(false);
      expect(mockServerSlotModel.findAll).not.toHaveBeenCalled();
    });

    it('returns an empty map for an empty drive list', async () => {
      const map = await service.getCurrentAssignmentsForDrives([]);
      expect(map.size).toBe(0);
      expect(mockAllocationModel.findAll).not.toHaveBeenCalled();
    });
  });

  describe('saveAssignments', () => {
    beforeEach(() => {
      vi.spyOn(service, 'getBoard').mockResolvedValue(
        {} as unknown as SlotAssignmentBoard,
      );
    });

    it('rejects a slot that does not belong to the addressed server', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue(serverRecord);
      mockServerSlotModel.findAll.mockResolvedValue([{ id: 'slot-1' }]);

      await expect(
        service.saveAssignments(
          'server-1',
          [{ slotId: 'slot-x', physicalDriveId: 'd1' }],
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockAllocationModel.create).not.toHaveBeenCalled();
    });

    it('rejects a drive listed more than once', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue(serverRecord);
      mockServerSlotModel.findAll.mockResolvedValue([
        { id: 'slot-1' },
        { id: 'slot-2' },
      ]);

      await expect(
        service.saveAssignments(
          'server-1',
          [
            { slotId: 'slot-1', physicalDriveId: 'd1' },
            { slotId: 'slot-2', physicalDriveId: 'd1' },
          ],
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockAllocationModel.create).not.toHaveBeenCalled();
    });

    it('rejects a desired drive located in a different datacenter', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue(serverRecord);
      mockServerSlotModel.findAll.mockResolvedValue([{ id: 'slot-1' }]);
      mockAllocationModel.findAll.mockResolvedValue([]);
      mockPhysicalDriveModel.findAll.mockResolvedValue([{ id: 'd1' }]);
      mockLocationModel.findAll.mockResolvedValue([
        {
          physicalDriveId: 'd1',
          datacenterId: 'dc-2',
          locatedAt: new Date(),
          displayKey: 1,
        },
      ]);

      await expect(
        service.saveAssignments(
          'server-1',
          [{ slotId: 'slot-1', physicalDriveId: 'd1' }],
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
      expect(mockAllocationModel.create).not.toHaveBeenCalled();
    });

    it('appends UNMOUNT for removed drives then MOUNT for the new seating', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue(serverRecord);
      mockServerSlotModel.findAll.mockResolvedValue([
        { id: 'slot-1' },
        { id: 'slot-2' },
      ]);
      // Serves both the slot-occupancy derivation (d1 in slot-1) and the
      // per-drive latest-event lookup.
      mockAllocationModel.findAll.mockResolvedValue([
        {
          id: 'alloc-1',
          serverSlotId: 'slot-1',
          physicalDriveId: 'd1',
          actionType: ServerSlotActionType.MOUNT,
          timestamp: new Date('2026-07-01T00:00:00Z'),
        },
      ]);
      mockPhysicalDriveModel.findAll.mockResolvedValue([
        { id: 'd1', label: 'D1' },
        { id: 'd2', label: 'D2' },
      ]);
      mockLocationModel.findAll.mockResolvedValue([
        {
          physicalDriveId: 'd2',
          datacenterId: 'dc-1',
          locatedAt: new Date('2026-07-01T00:00:00Z'),
          displayKey: 1,
        },
      ]);
      mockAllocationModel.create.mockResolvedValue({ id: 'alloc-new' });

      await service.saveAssignments(
        'server-1',
        [{ slotId: 'slot-2', physicalDriveId: 'd2' }],
        'user-1',
      );

      const createCalls = mockAllocationModel.create.mock.calls as unknown as [
        {
          actionType: ServerSlotActionType;
          serverSlotId: string;
          physicalDriveId: string;
        },
      ][];
      expect(
        createCalls.map((call) => [
          call[0].actionType,
          call[0].serverSlotId,
          call[0].physicalDriveId,
        ]),
      ).toEqual([
        [ServerSlotActionType.UNMOUNT, 'slot-1', 'd1'],
        [ServerSlotActionType.MOUNT, 'slot-2', 'd2'],
      ]);
    });

    it('does nothing when the desired seating matches the current one', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue(serverRecord);
      mockServerSlotModel.findAll.mockResolvedValue([{ id: 'slot-1' }]);
      mockAllocationModel.findAll.mockResolvedValue([
        {
          id: 'alloc-1',
          serverSlotId: 'slot-1',
          physicalDriveId: 'd1',
          actionType: ServerSlotActionType.MOUNT,
          timestamp: new Date('2026-07-01T00:00:00Z'),
        },
      ]);
      mockPhysicalDriveModel.findAll.mockResolvedValue([
        { id: 'd1', label: 'D1' },
      ]);
      mockLocationModel.findAll.mockResolvedValue([
        {
          physicalDriveId: 'd1',
          datacenterId: 'dc-1',
          locatedAt: new Date('2026-07-01T00:00:00Z'),
          displayKey: 1,
        },
      ]);

      await service.saveAssignments(
        'server-1',
        [{ slotId: 'slot-1', physicalDriveId: 'd1' }],
        'user-1',
      );

      expect(mockAllocationModel.create).not.toHaveBeenCalled();
    });
  });
});
