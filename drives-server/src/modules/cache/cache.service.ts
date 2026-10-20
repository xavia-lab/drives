import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheKeyBuilder } from './cache-key.builder';
import { ValkeyService } from './valkey.service';

export interface CacheableResponse<T = unknown> {
  statusCode: number;
  body: T;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    private readonly valkey: ValkeyService,
    private readonly keyBuilder: CacheKeyBuilder,
    private readonly config: ConfigService,
  ) {}

  isEnabled(): boolean {
    return this.valkey.isEnabled();
  }

  isAvailable(): boolean {
    return this.valkey.isAvailable();
  }

  get defaultTtlMs(): number {
    return this.config.get<number>('cache.defaultTtlMs', 15 * 60 * 1000);
  }

  get maxResponseBytes(): number {
    return this.config.get<number>('cache.maxResponseBytes', 256 * 1024);
  }

  async getTagVersions(tags: string[]): Promise<Record<string, string>> {
    if (tags.length === 0) return {};

    const keys = tags.map((tag) => this.keyBuilder.tagVersionKey(tag));
    const values = await this.valkey.mget(keys);

    return Object.fromEntries(
      tags.map((tag, index) => [tag, values?.[index] ?? '0']),
    );
  }

  buildKey(input: {
    method: string;
    path: string;
    query: Record<string, unknown>;
    tagVersions: Record<string, string>;
  }): string {
    return this.keyBuilder.build(input);
  }

  async get<T>(key: string): Promise<CacheableResponse<T> | null> {
    return this.valkey.get<CacheableResponse<T>>(key);
  }

  async set<T>(
    key: string,
    response: CacheableResponse<T>,
    ttlMs?: number,
  ): Promise<boolean> {
    const serialized = JSON.stringify(response.body);
    if (Buffer.byteLength(serialized, 'utf8') > this.maxResponseBytes) {
      return false;
    }

    return this.valkey.set(
      key,
      response,
      this.withJitter(ttlMs ?? this.defaultTtlMs),
    );
  }

  async invalidateTags(tags: string[]): Promise<void> {
    if (!this.isEnabled() || tags.length === 0) return;

    const results = await Promise.all(
      tags.map((tag) => this.valkey.incr(this.keyBuilder.tagVersionKey(tag))),
    );

    if (results.some((result) => result === null)) {
      this.logger.warn(
        `Could not fully invalidate cache tags: ${tags.join(', ')}`,
      );
    }
  }

  private withJitter(ttlMs: number): number {
    const jitter = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.round(ttlMs * jitter));
  }
}
