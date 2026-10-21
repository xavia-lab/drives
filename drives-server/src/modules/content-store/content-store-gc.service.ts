import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Cron } from '@nestjs/schedule';
import { QueryTypes, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Media } from '../media/entities/media.entity';
import { ContentStoreService } from './services/content-store.service';

const GC_LOCK_KEY = 2_026_102_003;

/**
 * Reclaims content objects that have no media row after a grace period.
 *
 * Content is written before the database transaction, so a failed attachment
 * transaction can leave an unreferenced object. Orphans are harmless and
 * content-addressed (reusing the same bytes is a no-op), but this job keeps
 * storage from growing indefinitely.
 */
@Injectable()
export class ContentStoreGcService {
  private readonly logger = new Logger(ContentStoreGcService.name);
  private running = false;

  constructor(
    @InjectModel(Media)
    private readonly mediaModel: typeof Media,
    private readonly contentStore: ContentStoreService,
    private readonly config: ConfigService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  @Cron('0 4 * * *', {
    name: 'content-store-gc',
    timeZone: 'UTC',
    waitForCompletion: true,
  })
  async runScheduledGc(): Promise<void> {
    await this.runGc();
  }

  async runGc(): Promise<number | null> {
    if (!this.isEnabled()) return null;
    if (this.running) {
      this.logger.warn('Skipping content-store GC: a run is already active');
      return null;
    }

    this.running = true;
    try {
      return await this.runWithLock(() => this.performGc());
    } catch (error) {
      this.logger.error(
        `Content-store GC failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    } finally {
      this.running = false;
    }
  }

  private async performGc(): Promise<number> {
    const graceMs = this.config.get<number>(
      'contentStore.gc.graceMs',
      24 * 60 * 60 * 1000,
    );
    const batchSize = this.config.get<number>('contentStore.gc.batchSize', 500);

    const [objects, media] = await Promise.all([
      this.contentStore.listContentObjects(),
      this.mediaModel.findAll({
        attributes: ['fileId'],
        paranoid: false,
      }),
    ]);

    const referenced = new Set(
      media
        .map((item) => item.fileId)
        .filter((fileId): fileId is string => Boolean(fileId)),
    );
    const cutoff = Date.now() - graceMs;
    const candidates = objects
      .filter(
        (object) =>
          !referenced.has(object.fileId) &&
          object.lastModified !== null &&
          object.lastModified.getTime() < cutoff,
      )
      .slice(0, Math.max(1, batchSize));

    let deleted = 0;
    for (const object of candidates) {
      try {
        await this.contentStore.delete(object.fileId);
        deleted += 1;
      } catch (error) {
        this.logger.warn(
          `Could not delete orphaned content ${object.fileId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (deleted > 0) {
      this.logger.log(
        `Content-store GC removed ${deleted} unreferenced object(s)`,
      );
    }

    return deleted;
  }

  private async runWithLock(
    work: () => Promise<number>,
  ): Promise<number | null> {
    if (this.sequelize.getDialect() !== 'postgres') {
      return work();
    }

    return this.sequelize.transaction(async (transaction: Transaction) => {
      const rows = await this.sequelize.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_xact_lock(:key) AS locked',
        {
          replacements: { key: GC_LOCK_KEY },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      if (!rows[0]?.locked) {
        this.logger.warn(
          'Skipping content-store GC: another replica holds the lock',
        );
        return null;
      }

      return work();
    });
  }

  private isEnabled(): boolean {
    return this.config.get<boolean>('contentStore.gc.enabled', true);
  }
}
