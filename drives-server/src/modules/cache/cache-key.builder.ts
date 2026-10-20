import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface CacheKeyInput {
  method: string;
  path: string;
  query: Record<string, unknown>;
  tagVersions: Record<string, string>;
}

/**
 * Produces short, deterministic cache keys from the request shape plus the
 * current version of every tag the entry depends on.
 */
@Injectable()
export class CacheKeyBuilder {
  private readonly schemaVersion = 'v1';

  build(input: CacheKeyInput): string {
    const tagVersionString = Object.entries(input.tagVersions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, version]) => `${tag}=${version}`)
      .join(',');

    const canonical = JSON.stringify({
      method: input.method.toUpperCase(),
      path: input.path,
      query: this.canonicalize(input.query),
      tags: tagVersionString,
    });

    const hash = createHash('sha256')
      .update(canonical)
      .digest('hex')
      .slice(0, 32);

    return `http:${this.schemaVersion}:${hash}`;
  }

  tagVersionKey(tag: string): string {
    return `tag:${tag}:version`;
  }

  private canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.canonicalize(entry));
    }

    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([, entry]) => entry !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, entry]) => [key, this.canonicalize(entry)]),
      );
    }

    return value;
  }
}
