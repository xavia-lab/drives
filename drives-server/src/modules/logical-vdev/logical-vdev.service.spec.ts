import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { LogicalVdevService } from './logical-vdev.service';
import { LogicalVdev } from './entities/logical-vdev.entity';
import { LogicalDisk } from '../logical-disk/entities/logical-disk.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';
import { VdevProfile } from '../vdev-profile/entities/vdev-profile.entity';
import { LogicalVdevEvent } from './entities/logical-vdev-event.entity';
import { PoolType } from '../pool-type/entities/pool-type.entity';
import { PaginationService } from '../pagination/pagination.service';
import { VdevCapacityService } from './vdev-capacity.service';

describe('LogicalVdevService', () => {
  let service: LogicalVdevService;
  let vdevModel: Record<string, Mock>;
  let storagePoolModel: Record<string, Mock>;
  let vdevProfileModel: Record<string, Mock>;
  let poolTypeModel: Record<string, Mock>;
  let velocityEventModel: Record<string, Mock>;
  let paginationService: { paginate: Mock };
  let capacityService: {
    calculateMany: Mock;
    calculate: Mock;
    getMembers: Mock;
  };

  beforeEach(async () => {
    vdevModel = {
      findByPk: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    };
    storagePoolModel = { findByPk: vi.fn() };
    vdevProfileModel = { findByPk: vi.fn() };
    poolTypeModel = { findByPk: vi.fn() };
    velocityEventModel = { create: vi.fn() };
    paginationService = { paginate: vi.fn() };
    capacityService = {
      calculateMany: vi.fn().mockResolvedValue(new Map()),
      calculate: vi.fn(),
      getMembers: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogicalVdevService,
        { provide: getModelToken(LogicalVdev), useValue: vdevModel },
        { provide: getModelToken(LogicalDisk), useValue: {} },
        {
          provide: getModelToken(StoragePool),
          useValue: storagePoolModel,
        },
        {
          provide: getModelToken(VdevProfile),
          useValue: vdevProfileModel,
        },
        {
          provide: getModelToken(PoolType),
          useValue: poolTypeModel,
        },
        {
          provide: getModelToken(LogicalVdevEvent),
          useValue: velocityEventModel,
        },
        {
          provide: getConnectionToken(),
          useValue: {
            transaction: vi.fn((cb: (t: unknown) => unknown) => cb({})),
          },
        },
        { provide: PaginationService, useValue: paginationService },
        { provide: VdevCapacityService, useValue: capacityService },
      ],
    }).compile();

    service = module.get(LogicalVdevService);
  });

  it('delegates pagination and enriches capacities', async () => {
    const vdev = { id: 'vdev-1', setDataValue: vi.fn() };
    paginationService.paginate.mockResolvedValue({ data: [vdev], meta: {} });
    capacityService.calculateMany.mockResolvedValue(
      new Map([['vdev-1', { memberCount: 3 }]]),
    );

    const result = await service.findAll({ pageNumber: 1, pageSize: 10 });

    expect(result.data).toHaveLength(1);
    expect(vdev.setDataValue).toHaveBeenCalledWith('capacity', {
      memberCount: 3,
    });
  });

  it('rejects a vdev profile incompatible with the pool type', async () => {
    storagePoolModel.findByPk.mockResolvedValue({
      id: 'pool-1',
      poolTypeId: 'pooltype-1',
    });
    vdevProfileModel.findByPk.mockResolvedValue({
      id: 'profile-1',
      code: 'RAIDZ2',
      technology: 'ZFS',
      toJSON: () => ({}),
    });
    poolTypeModel.findByPk.mockResolvedValue({
      id: 'pooltype-1',
      name: 'BTRFS',
    });
    vdevModel.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        storagePoolId: 'pool-1',
        redundancyProfileId: 'profile-1',
        vdevName: 'raidz2-0',
      }),
    ).rejects.toThrow(ConflictException);
    expect(vdevModel.create).not.toHaveBeenCalled();
  });

  it('throws when a vdev does not exist', async () => {
    vdevModel.findByPk.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});
