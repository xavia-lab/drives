import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service';
import { ExchangeRateSyncService } from '../exchange-rate/exchange-rate-sync.service';
import { ExchangeRateHousekeepingService } from '../exchange-rate/exchange-rate-housekeeping.service';
import { ContentStoreGcService } from '../content-store/content-store-gc.service';
import { ContentStoreMaintenanceService } from '../content-store/content-store-maintenance.service';
import { TaskRunService } from './task-run.service';

const cronJob = (last: Date, next: Date) => ({
  lastDate: () => last,
  nextDate: () => ({ toJSDate: () => next }),
});

describe('TasksService', () => {
  let service: TasksService;
  let config: { get: ReturnType<typeof vi.fn> };
  let scheduler: { getCronJob: ReturnType<typeof vi.fn> };
  let syncService: { syncRates: ReturnType<typeof vi.fn> };
  let housekeepingService: { cleanupOldRates: ReturnType<typeof vi.fn> };
  let gcService: { runGc: ReturnType<typeof vi.fn> };
  let maintenanceService: {
    getStatus: ReturnType<typeof vi.fn>;
    runNow: ReturnType<typeof vi.fn>;
  };
  let taskRunService: {
    getLatestRuns: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    config = {
      get: vi.fn((key: string, fallback: unknown) => {
        const values: Record<string, unknown> = {
          'exchangeRate.enabled': true,
          'contentStore.gc.enabled': true,
        };
        return values[key] ?? fallback;
      }),
    };
    const jobs = new Map<string, ReturnType<typeof cronJob>>([
      [
        'exchange-rate-sync',
        cronJob(
          new Date('2026-10-20T10:00:00.000Z'),
          new Date('2026-10-20T11:00:00.000Z'),
        ),
      ],
      [
        'exchange-rate-housekeeping',
        cronJob(
          new Date('2026-10-20T03:15:00.000Z'),
          new Date('2026-10-21T03:15:00.000Z'),
        ),
      ],
      [
        'content-store-gc',
        cronJob(
          new Date('2026-10-20T04:00:00.000Z'),
          new Date('2026-10-21T04:00:00.000Z'),
        ),
      ],
    ]);
    scheduler = {
      getCronJob: vi.fn((name: string) => {
        const job = jobs.get(name);
        if (!job) throw new Error('not found');
        return job;
      }),
    };
    syncService = { syncRates: vi.fn().mockResolvedValue({ stored: 3 }) };
    housekeepingService = { cleanupOldRates: vi.fn().mockResolvedValue(2) };
    gcService = { runGc: vi.fn().mockResolvedValue(1) };
    maintenanceService = {
      getStatus: vi.fn(() => ({
        supported: true,
        enabled: true,
        intervalMs: 6 * 60 * 60 * 1000,
        lastRunAt: new Date('2026-10-20T06:00:00.000Z'),
        nextRunAt: new Date('2026-10-20T12:00:00.000Z'),
      })),
      runNow: vi.fn().mockResolvedValue(4),
    };
    taskRunService = {
      getLatestRuns: vi.fn().mockResolvedValue(new Map()),
      run: vi.fn((_key: string, _trigger: string, work: () => unknown) =>
        work(),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: SchedulerRegistry, useValue: scheduler },
        { provide: ConfigService, useValue: config },
        { provide: TaskRunService, useValue: taskRunService },
        { provide: ExchangeRateSyncService, useValue: syncService },
        {
          provide: ExchangeRateHousekeepingService,
          useValue: housekeepingService,
        },
        { provide: ContentStoreGcService, useValue: gcService },
        {
          provide: ContentStoreMaintenanceService,
          useValue: maintenanceService,
        },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  it('lists cron and interval tasks with last/next run times', async () => {
    const tasks = await service.getTasks();

    expect(tasks).toHaveLength(4);
    expect(tasks[0]).toMatchObject({
      key: 'exchange-rate-sync',
      lastRunAt: '2026-10-20T10:00:00.000Z',
      nextRunAt: '2026-10-20T11:00:00.000Z',
      enabled: true,
    });
    expect(tasks[3]).toMatchObject({
      key: 'content-store-tmp-cleanup',
      schedule: 'Every 6 hours',
      lastRunAt: '2026-10-20T06:00:00.000Z',
      nextRunAt: '2026-10-20T12:00:00.000Z',
    });
  });

  it('triggers a task manually and records the manual run time', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T10:30:00.000Z'));

    taskRunService.getLatestRuns.mockResolvedValue(
      new Map([
        [
          'content-store-gc',
          {
            startedAt: new Date('2026-10-20T10:30:00.000Z'),
            status: 'SUCCEEDED',
            durationMs: 10,
            errorMessage: null,
          },
        ],
      ]),
    );

    const task = await service.runTask('content-store-gc');

    expect(gcService.runGc).toHaveBeenCalled();
    expect(task.key).toBe('content-store-gc');
    expect(task.lastRunAt).toBe('2026-10-20T10:30:00.000Z');
    expect(task.lastStatus).toBe('SUCCEEDED');

    vi.useRealTimers();
  });

  it('rejects disabled tasks', async () => {
    config.get.mockImplementation((key: string, fallback: unknown) =>
      key === 'contentStore.gc.enabled' ? false : fallback,
    );

    await expect(service.runTask('content-store-gc')).rejects.toThrow(
      /disabled/,
    );
  });

  it('rejects unknown task keys', async () => {
    await expect(service.runTask('missing')).rejects.toThrow(/not found/);
  });

  it('omits the staging task when the provider has no local staging area', async () => {
    maintenanceService.getStatus.mockReturnValue({
      supported: false,
      enabled: false,
      intervalMs: 0,
      lastRunAt: null,
      nextRunAt: null,
    });

    const tasks = await service.getTasks();
    expect(tasks.map((task) => task.key)).not.toContain(
      'content-store-tmp-cleanup',
    );
  });
});
