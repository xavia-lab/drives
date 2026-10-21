import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundTaskRun } from './entities/background-task-run.entity';
import { TaskRunService } from './task-run.service';

describe('TaskRunService', () => {
  let service: TaskRunService;
  let model: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    model = {
      create: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue([0]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskRunService,
        { provide: getModelToken(BackgroundTaskRun), useValue: model },
      ],
    }).compile();

    service = module.get(TaskRunService);
  });

  it('records a successful run', async () => {
    const run = { update: vi.fn().mockResolvedValue(undefined) };
    model.create.mockResolvedValue(run);

    const result = await service.run('task-a', 'SCHEDULED', () =>
      Promise.resolve(5),
    );

    expect(result).toBe(5);
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taskKey: 'task-a',
        triggerType: 'SCHEDULED',
        status: 'RUNNING',
      }),
    );
    expect(run.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'SUCCEEDED',
        result: { value: 5 },
      }),
    );
  });

  it('records a skipped run when the work returns null', async () => {
    const run = { update: vi.fn().mockResolvedValue(undefined) };
    model.create.mockResolvedValue(run);

    await service.run('task-a', 'SCHEDULED', () => Promise.resolve(null));

    expect(run.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'SKIPPED' }),
    );
  });

  it('records a failed run and rethrows the error', async () => {
    const run = { update: vi.fn().mockResolvedValue(undefined) };
    model.create.mockResolvedValue(run);

    await expect(
      service.run('task-a', 'MANUAL', () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');

    expect(run.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        errorMessage: 'boom',
      }),
    );
  });

  it('returns only the latest run per task', async () => {
    model.findAll.mockResolvedValue([
      { taskKey: 'task-a', displayKey: 2 },
      { taskKey: 'task-a', displayKey: 1 },
      { taskKey: 'task-b', displayKey: 3 },
    ]);

    const latest = await service.getLatestRuns(['task-a', 'task-b']);

    expect(latest.get('task-a')?.displayKey).toBe(2);
    expect(latest.get('task-b')?.displayKey).toBe(3);
    expect(latest.size).toBe(2);
  });

  it('marks stale running rows as failed on startup', async () => {
    model.update.mockResolvedValue([2]);

    await service.onModuleInit();

    const call = model.update.mock.calls[0] as [
      Record<string, unknown>,
      { where: { status: string } },
    ];
    expect(call[0].status).toBe('FAILED');
    expect(call[1].where.status).toBe('RUNNING');
  });
});
