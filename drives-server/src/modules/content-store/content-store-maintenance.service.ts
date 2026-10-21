import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStoreConfig } from './interfaces/content-store-config.interface';
import { CONTENT_STORE_PROVIDER } from './interfaces/content-store-provider.interface';
import type { ContentStoreProvider } from './interfaces/content-store-provider.interface';
import { TaskRunService } from '../tasks/task-run.service';
import { BackgroundTaskTrigger } from '../tasks/entities/background-task-run.entity';

export interface ContentStoreMaintenanceStatus {
  supported: boolean;
  enabled: boolean;
  intervalMs: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
}

/**
 * Sweeps stale staging files left behind by a crashed upload. Local storage is
 * the only current provider that stages writes; other providers are skipped.
 */
@Injectable()
export class ContentStoreMaintenanceService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ContentStoreMaintenanceService.name);
  private timer: NodeJS.Timeout | undefined;
  private supported = false;
  private intervalMs = 0;
  private maxAgeMs = 0;
  private lastRunAt: Date | null = null;
  private nextRunAt: Date | null = null;

  constructor(
    @Inject(CONTENT_STORE_PROVIDER)
    private readonly storage: ContentStoreProvider,
    private readonly config: ConfigService,
    private readonly taskRunService: TaskRunService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.storage.cleanupIncompleteUploads) return;

    this.supported = true;
    const local = this.config.get<ContentStoreConfig['local']>(
      'contentStore.local',
      {
        root: 'data/content-store',
        tmpMaxAgeMs: 60 * 60 * 1000,
        cleanupIntervalMs: 6 * 60 * 60 * 1000,
      },
    );

    this.maxAgeMs = local.tmpMaxAgeMs;
    this.intervalMs = local.cleanupIntervalMs;

    await this.taskRunService.run(
      'content-store-tmp-cleanup',
      BackgroundTaskTrigger.SCHEDULED,
      () => this.execute(),
    );
    this.schedule();
  }

  onModuleDestroy(): void {
    this.clearTimer();
  }

  getStatus(): ContentStoreMaintenanceStatus {
    return {
      supported: this.supported,
      enabled: this.supported && this.intervalMs > 0,
      intervalMs: this.intervalMs,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
    };
  }

  async runNow(): Promise<number | null> {
    if (!this.supported) return null;
    const removed = await this.execute();
    this.schedule();
    return removed;
  }

  private async execute(): Promise<number | null> {
    try {
      const removed =
        (await this.storage.cleanupIncompleteUploads?.(this.maxAgeMs)) ?? 0;
      if (removed > 0) {
        this.logger.log(
          `Removed ${removed} stale content-store temporary file(s)`,
        );
      }
      this.lastRunAt = new Date();
      if (this.intervalMs > 0) {
        this.nextRunAt = new Date(Date.now() + this.intervalMs);
      }
      return removed;
    } catch (error) {
      this.lastRunAt = new Date();
      this.logger.warn(
        `Content-store temporary cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private schedule(): void {
    this.clearTimer();
    if (!this.supported || this.intervalMs <= 0) {
      this.nextRunAt = null;
      return;
    }

    this.nextRunAt = new Date(Date.now() + this.intervalMs);
    this.timer = setInterval(() => {
      void this.taskRunService.run(
        'content-store-tmp-cleanup',
        BackgroundTaskTrigger.SCHEDULED,
        () => this.execute(),
      );
    }, this.intervalMs);
    this.timer.unref();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
