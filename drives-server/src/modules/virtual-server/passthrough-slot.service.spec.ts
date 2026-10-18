import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PassthroughSlotService } from './passthrough-slot.service';
import { PassthroughSlot } from './entities/passthrough-slot.entity';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

describe('PassthroughSlotService', () => {
  let service: PassthroughSlotService;

  let mockPassthroughSlotModel: Record<string, Mock>;
  let mockServerSlotModel: Record<string, Mock>;

  beforeEach(async () => {
    mockPassthroughSlotModel = {
      findAll: vi.fn(),
      destroy: vi.fn(),
      create: vi.fn(),
    };
    mockServerSlotModel = { findAll: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassthroughSlotService,
        {
          provide: getModelToken(PassthroughSlot),
          useValue: mockPassthroughSlotModel,
        },
        { provide: getModelToken(ServerSlot), useValue: mockServerSlotModel },
      ],
    }).compile();

    service = module.get<PassthroughSlotService>(PassthroughSlotService);
    vi.clearAllMocks();
  });

  describe('syncForVirtualServer', () => {
    it('should reject duplicate slot references within the payload', async () => {
      await expect(
        service.syncForVirtualServer('vs-uuid', 'server-uuid', [
          { serverSlotId: 'slot-1' },
          { serverSlotId: 'slot-1' },
        ]),
      ).rejects.toThrow(ConflictException);

      expect(mockServerSlotModel.findAll).not.toHaveBeenCalled();
    });

    it('should reject slots that do not belong to the host server', async () => {
      mockServerSlotModel.findAll.mockResolvedValue([{ id: 'slot-1' }]);

      await expect(
        service.syncForVirtualServer('vs-uuid', 'server-uuid', [
          { serverSlotId: 'slot-1' },
          { serverSlotId: 'slot-other-host' },
        ]),
      ).rejects.toThrow(BadRequestException);

      expect(mockPassthroughSlotModel.findAll).not.toHaveBeenCalled();
    });

    it('should reject slots already passed through to another virtual server', async () => {
      mockServerSlotModel.findAll.mockResolvedValue([{ id: 'slot-1' }]);
      mockPassthroughSlotModel.findAll.mockResolvedValueOnce([
        { serverSlotId: 'slot-1' },
      ]);

      await expect(
        service.syncForVirtualServer('vs-uuid', 'server-uuid', [
          { serverSlotId: 'slot-1' },
        ]),
      ).rejects.toThrow(ConflictException);
    });

    it('should delete removed, keep existing and create new mappings', async () => {
      mockServerSlotModel.findAll.mockResolvedValue([
        { id: 'slot-1' },
        { id: 'slot-2' },
      ]);
      mockPassthroughSlotModel.findAll
        .mockResolvedValueOnce([]) // conflict check
        .mockResolvedValueOnce([
          { id: 'ps-1', serverSlotId: 'slot-1' },
          { id: 'ps-removed', serverSlotId: 'slot-old' },
        ]); // existing for this guest

      const transaction = { id: 'tx' } as never;

      await service.syncForVirtualServer(
        'vs-uuid',
        'server-uuid',
        [
          { serverSlotId: 'slot-1' },
          { id: 'client-generated', serverSlotId: 'slot-2' },
        ],
        transaction,
      );

      expect(mockPassthroughSlotModel.destroy).toHaveBeenCalledWith({
        where: { id: ['ps-removed'] },
        transaction,
      });
      expect(mockPassthroughSlotModel.create).toHaveBeenCalledTimes(1);
      expect(mockPassthroughSlotModel.create).toHaveBeenCalledWith(
        {
          id: 'client-generated',
          virtualServerId: 'vs-uuid',
          serverSlotId: 'slot-2',
        },
        { transaction },
      );
    });

    it('should remove every mapping when given an empty payload', async () => {
      mockPassthroughSlotModel.findAll.mockResolvedValueOnce([
        { id: 'ps-1', serverSlotId: 'slot-1' },
        { id: 'ps-2', serverSlotId: 'slot-2' },
      ]);

      await service.syncForVirtualServer('vs-uuid', 'server-uuid', []);

      expect(mockServerSlotModel.findAll).not.toHaveBeenCalled();
      expect(mockPassthroughSlotModel.destroy).toHaveBeenCalledWith({
        where: { id: ['ps-1', 'ps-2'] },
        transaction: undefined,
      });
      expect(mockPassthroughSlotModel.create).not.toHaveBeenCalled();
    });
  });
});
