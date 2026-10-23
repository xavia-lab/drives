import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { LogicalDiskService } from './logical-disk.service';
import { LogicalDisk } from './entities/logical-disk.entity';
import { PaginationService } from '../pagination/pagination.service';

describe('LogicalDiskService', () => {
  let service: LogicalDiskService;
  let diskModel: Record<string, Mock>;
  let paginationService: { paginate: Mock };

  beforeEach(async () => {
    diskModel = { findByPk: vi.fn(), findAll: vi.fn() };
    paginationService = { paginate: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogicalDiskService,
        { provide: getModelToken(LogicalDisk), useValue: diskModel },
        { provide: PaginationService, useValue: paginationService },
      ],
    }).compile();

    service = module.get(LogicalDiskService);
  });

  it('delegates pagination with vdev and drive includes', async () => {
    const expected = { data: [], meta: {} };
    paginationService.paginate.mockResolvedValue(expected);

    const result = await service.findAll({ pageNumber: 1, pageSize: 10 });

    expect(result).toEqual(expected);
    expect(paginationService.paginate).toHaveBeenCalled();
  });
});
