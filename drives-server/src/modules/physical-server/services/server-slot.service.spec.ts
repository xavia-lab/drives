import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServerSlotService } from './server-slot.service';
import { ServerSlot } from '../entities/server-slot.entity';
import { Interface } from '../../interface/entities/interface.entity';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

describe('ServerSlotService', () => {
  let service: ServerSlotService;

  let mockServerSlotModel: Record<string, Mock>;
  let mockInterfaceModel: Record<string, Mock>;

  beforeEach(async () => {
    mockServerSlotModel = {
      findAll: vi.fn(),
      destroy: vi.fn(),
      create: vi.fn(),
    };
    mockInterfaceModel = { findAll: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerSlotService,
        { provide: getModelToken(ServerSlot), useValue: mockServerSlotModel },
        { provide: getModelToken(Interface), useValue: mockInterfaceModel },
      ],
    }).compile();

    service = module.get<ServerSlotService>(ServerSlotService);
    vi.clearAllMocks();
  });

  describe('syncForServer', () => {
    it('should reject duplicate labels within the submitted payload', async () => {
      await expect(
        service.syncForServer('server-uuid', [
          { slotLabel: 'Bay 0', supportedInterfaceId: 'iface-1' },
          { slotLabel: 'Bay 0', supportedInterfaceId: 'iface-2' },
        ]),
      ).rejects.toThrow(ConflictException);

      expect(mockInterfaceModel.findAll).not.toHaveBeenCalled();
    });

    it('should throw a NotFoundException listing every missing interface', async () => {
      mockInterfaceModel.findAll.mockResolvedValue([{ id: 'iface-1' }]);

      await expect(
        service.syncForServer('server-uuid', [
          { slotLabel: 'Bay 0', supportedInterfaceId: 'iface-1' },
          { slotLabel: 'Bay 1', supportedInterfaceId: 'iface-missing' },
        ]),
      ).rejects.toThrow(
        new NotFoundException('Interface with ID iface-missing not found'),
      );

      expect(mockServerSlotModel.findAll).not.toHaveBeenCalled();
    });

    it('should reject a label that collides with a retained slot on the server', async () => {
      mockInterfaceModel.findAll.mockResolvedValue([{ id: 'iface-1' }]);
      mockServerSlotModel.findAll.mockResolvedValue([
        { id: 'slot-existing', slotLabel: 'Bay 0' },
      ]);

      await expect(
        service.syncForServer('server-uuid', [
          { slotLabel: 'Bay 0', supportedInterfaceId: 'iface-1' },
        ]),
      ).rejects.toThrow(ConflictException);
    });

    it('should delete removed, update retained and create new slots', async () => {
      const retainedUpdate = vi.fn().mockResolvedValue(undefined);
      mockInterfaceModel.findAll.mockResolvedValue([
        { id: 'iface-1' },
        { id: 'iface-2' },
      ]);
      mockServerSlotModel.findAll.mockResolvedValue([
        {
          id: 'slot-1',
          slotLabel: 'Bay 0',
          supportedInterfaceId: 'iface-1',
          update: retainedUpdate,
        },
        { id: 'slot-removed', slotLabel: 'Bay 9' },
      ]);

      const transaction = { id: 'tx' } as never;

      await service.syncForServer(
        'server-uuid',
        [
          {
            id: 'slot-1',
            slotLabel: 'Bay 0',
            supportedInterfaceId: 'iface-1',
            pcieBusAddress: '0000:41:00.0',
          },
          {
            id: 'slot-client-generated',
            slotLabel: 'Bay 1',
            supportedInterfaceId: 'iface-2',
          },
        ],
        transaction,
      );

      expect(mockServerSlotModel.destroy).toHaveBeenCalledWith({
        where: { id: ['slot-removed'] },
        transaction,
      });
      expect(retainedUpdate).toHaveBeenCalledWith(
        {
          slotLabel: 'Bay 0',
          supportedInterfaceId: 'iface-1',
          pcieBusAddress: '0000:41:00.0',
        },
        { transaction },
      );
      expect(mockServerSlotModel.create).toHaveBeenCalledWith(
        {
          id: 'slot-client-generated',
          serverId: 'server-uuid',
          slotLabel: 'Bay 1',
          supportedInterfaceId: 'iface-2',
          pcieBusAddress: null,
        },
        { transaction },
      );
    });

    it('should remove every slot when given an empty payload', async () => {
      mockServerSlotModel.findAll.mockResolvedValue([
        { id: 'slot-1' },
        { id: 'slot-2' },
      ]);

      await service.syncForServer('server-uuid', []);

      expect(mockInterfaceModel.findAll).not.toHaveBeenCalled();
      expect(mockServerSlotModel.destroy).toHaveBeenCalledWith({
        where: { id: ['slot-1', 'slot-2'] },
        transaction: undefined,
      });
      expect(mockServerSlotModel.create).not.toHaveBeenCalled();
    });
  });
});
