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

  constructor(
    @Inject(CONTENT_STORE_PROVIDER)
    private readonly storage: ContentStoreProvider,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.storage.cleanupIncompleteUploads) return;

    const local = this.config.get<ContentStoreConfig['local']>(
      'contentStore.local',
      {
        root: 'data/content-store',
        tmpMaxAgeMs: 60 * 60 * 1000,
        cleanupIntervalMs: 6 * 60 * 60 * 1000,
      },
    );

    await this.cleanup(local.tmpMaxAgeMs);

    if (local.cleanupIntervalMs > 0) {
      this.timer = setInterval(() => {
        void this.cleanup(local.tmpMaxAgeMs);
      }, local.cleanupIntervalMs);
      this.timer.unref();
    }
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async cleanup(maxAgeMs: number): Promise<void> {
    try {
      const removed = await this.storage.cleanupIncompleteUploads?.(maxAgeMs);
      if (removed && removed > 0) {
        this.logger.log(
          `Removed ${removed} stale content-store temporary file(s)`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Content-store temporary cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
