import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ExchangeRateSyncService } from '../exchange-rate/exchange-rate-sync.service';
import { ExchangeRateHousekeepingService } from '../exchange-rate/exchange-rate-housekeeping.service';
import { ContentStoreGcService } from '../content-store/content-store-gc.service';
import { ContentStoreMaintenanceService } from '../content-store/content-store-maintenance.service';
import {
  BackgroundTaskRunStatus,
  BackgroundTaskTrigger,
} from './entities/background-task-run.entity';
import { TaskRunService } from './task-run.service';

export interface BackgroundTaskView {
  key: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastStatus: BackgroundTaskRunStatus | null;
  lastDurationMs: number | null;
  lastError: string | null;
  running: boolean;
  nextRunAt: string | null;
}

interface BackgroundTaskDefinition {
  key: string;
  name: string;
  description: string;
  schedule: string;
  isEnabled: () => boolean;
  run: () => Promise<unknown>;
  getLastRunAt: () => Date | null;
  getNextRunAt: () => Date | null;
}

const SYNC_CRON = 'exchange-rate-sync';
const HOUSEKEEPING_CRON = 'exchange-rate-housekeeping';
const GC_CRON = 'content-store-gc';

@Injectable()
export class TasksService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly config: ConfigService,
    private readonly taskRunService: TaskRunService,
    private readonly exchangeRateSync: ExchangeRateSyncService,
    private readonly exchangeRateHousekeeping: ExchangeRateHousekeepingService,
    private readonly contentStoreGc: ContentStoreGcService,
    private readonly contentStoreMaintenance: ContentStoreMaintenanceService,
  ) {}

  async getTasks(): Promise<BackgroundTaskView[]> {
    const definitions = this.definitions().filter(
      (definition) =>
        definition.key !== 'content-store-tmp-cleanup' ||
        this.contentStoreMaintenance.getStatus().supported,
    );
    const latestRuns = await this.taskRunService.getLatestRuns(
      definitions.map((definition) => definition.key),
    );

    return definitions.map((definition) =>
      this.toView(definition, latestRuns.get(definition.key)),
    );
  }

  async runTask(
    key: string,
    userId?: string | null,
  ): Promise<BackgroundTaskView> {
    const definition = this.definitions().find((task) => task.key === key);
    if (!definition) {
      throw new NotFoundException(`Background task ${key} was not found`);
    }
    if (!definition.isEnabled()) {
      throw new BadRequestException(`Background task ${key} is disabled`);
    }

    await this.taskRunService.run(
      key,
      BackgroundTaskTrigger.MANUAL,
      () => definition.run(),
      { userId },
    );

    const latest = await this.taskRunService.getLatestRuns([key]);
    return this.toView(definition, latest.get(key));
  }

  private definitions(): BackgroundTaskDefinition[] {
    return [
      {
        key: 'exchange-rate-sync',
        name: 'Exchange rate sync',
        description: 'Pulls the latest USD exchange rates from Frankfurter.',
        schedule: 'Every hour at :00 UTC',
        isEnabled: () => this.config.get<boolean>('exchangeRate.enabled', true),
        run: () => this.exchangeRateSync.syncRates(),
        getLastRunAt: () => this.cronLastRun(SYNC_CRON),
        getNextRunAt: () => this.cronNextRun(SYNC_CRON),
      },
      {
        key: 'exchange-rate-housekeeping',
        name: 'Exchange rate housekeeping',
        description:
          'Removes exchange-rate observations older than the retention window.',
        schedule: 'Daily at 03:15 UTC',
        isEnabled: () => this.config.get<boolean>('exchangeRate.enabled', true),
        run: () => this.exchangeRateHousekeeping.cleanupOldRates(),
        getLastRunAt: () => this.cronLastRun(HOUSEKEEPING_CRON),
        getNextRunAt: () => this.cronNextRun(HOUSEKEEPING_CRON),
      },
      {
        key: 'content-store-gc',
        name: 'Content store GC',
        description:
          'Reclaims unreferenced content objects after the grace period.',
        schedule: 'Daily at 04:00 UTC',
        isEnabled: () =>
          this.config.get<boolean>('contentStore.gc.enabled', true),
        run: () => this.contentStoreGc.runGc(),
        getLastRunAt: () => this.cronLastRun(GC_CRON),
        getNextRunAt: () => this.cronNextRun(GC_CRON),
      },
      {
        key: 'content-store-tmp-cleanup',
        name: 'Content store staging cleanup',
        description:
          'Removes stale temporary files left by interrupted uploads.',
        schedule: this.maintenanceSchedule(),
        isEnabled: () => this.contentStoreMaintenance.getStatus().enabled,
        run: () => this.contentStoreMaintenance.runNow(),
        getLastRunAt: () => this.contentStoreMaintenance.getStatus().lastRunAt,
        getNextRunAt: () => this.contentStoreMaintenance.getStatus().nextRunAt,
      },
    ];
  }

  private toView(
    definition: BackgroundTaskDefinition,
    latestRun?: {
      startedAt: Date;
      status: BackgroundTaskRunStatus;
      durationMs: number | null;
      errorMessage: string | null;
    },
  ): BackgroundTaskView {
    const lastRunAt = latestRun?.startedAt ?? definition.getLastRunAt();
    const enabled = definition.isEnabled();

    return {
      key: definition.key,
      name: definition.name,
      description: definition.description,
      schedule: definition.schedule,
      enabled,
      lastRunAt: lastRunAt?.toISOString() ?? null,
      lastStatus: latestRun?.status ?? null,
      lastDurationMs: latestRun?.durationMs ?? null,
      lastError: latestRun?.errorMessage ?? null,
      running: latestRun?.status === BackgroundTaskRunStatus.RUNNING,
      nextRunAt: enabled
        ? (definition.getNextRunAt()?.toISOString() ?? null)
        : null,
    };
  }

  private cronLastRun(name: string): Date | null {
    try {
      return this.schedulerRegistry.getCronJob(name).lastDate();
    } catch {
      return null;
    }
  }

  private cronNextRun(name: string): Date | null {
    try {
      return this.schedulerRegistry.getCronJob(name).nextDate().toJSDate();
    } catch {
      return null;
    }
  }

  private maintenanceSchedule(): string {
    const intervalMs = this.contentStoreMaintenance.getStatus().intervalMs;
    if (!intervalMs) return 'Disabled';

    const hours = intervalMs / 3_600_000;
    if (Number.isInteger(hours)) {
      return `Every ${hours} hour${hours === 1 ? '' : 's'}`;
    }

    const minutes = Math.round(intervalMs / 60_000);
    return `Every ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
}
