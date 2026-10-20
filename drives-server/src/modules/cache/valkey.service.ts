import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Thin, fail-open Valkey (Redis protocol) client.
 *
 * The cache is an optimization: connection/command failures are logged and
 * treated as cache misses so the API continues serving from Postgres.
 */
@Injectable()
export class ValkeyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ValkeyService.name);
  private client: Redis | undefined;
  private enabled = false;
  private available = false;
  private lastErrorLoggedAt = 0;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.enabled = this.config.get<boolean>('cache.enabled', false);
    if (!this.enabled) {
      this.logger.log('Cache disabled');
      return;
    }

    const url = this.config.get<string>('cache.url', 'redis://localhost:6379');
    const keyPrefix = this.config.get<string>('cache.keyPrefix', 'drives');

    this.client = new Redis(url, {
      keyPrefix,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      commandTimeout: this.config.get<number>('cache.commandTimeoutMs', 100),
      connectTimeout: this.config.get<number>('cache.connectTimeoutMs', 1000),
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    this.client.on('ready', () => {
      this.available = true;
      this.logger.log(`Connected to Valkey at ${url}`);
    });
    this.client.on('end', () => {
      this.available = false;
    });
    this.client.on('error', (error) => {
      this.available = false;
      this.logRateLimited(error);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isAvailable(): boolean {
    return this.enabled && this.available;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.available) return null;

    try {
      const value = await this.client.get(key);
      return value === null ? null : (JSON.parse(value) as T);
    } catch (error) {
      this.logRateLimited(error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlMs: number): Promise<boolean> {
    if (!this.client || !this.available) return false;

    try {
      await this.client.set(
        key,
        JSON.stringify(value),
        'PX',
        Math.max(1, Math.round(ttlMs)),
      );
      return true;
    } catch (error) {
      this.logRateLimited(error);
      return false;
    }
  }

  async incr(key: string): Promise<number | null> {
    if (!this.client || !this.available) return null;

    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logRateLimited(error);
      return null;
    }
  }

  async mget(keys: string[]): Promise<Array<string | null> | null> {
    if (!this.client || !this.available || keys.length === 0) return null;

    try {
      return await this.client.mget(...keys);
    } catch (error) {
      this.logRateLimited(error);
      return null;
    }
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  private logRateLimited(error: unknown): void {
    const now = Date.now();
    if (now - this.lastErrorLoggedAt < 60_000) return;
    this.lastErrorLoggedAt = now;
    this.logger.warn(
      `Valkey unavailable; serving requests without cache: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
