import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_METADATA = 'cache:cacheable';
export const INVALIDATE_CACHE_METADATA = 'cache:invalidate';

export interface CacheableOptions {
  /** Override the default cache TTL for this endpoint. */
  ttlMs?: number;
  /** Tags whose version is part of the cache key. */
  tags: string[];
  /** Include the authenticated user id in the key for user-specific reads. */
  private?: boolean;
}

/**
 * Cache a successful GET response under a canonical key derived from the route
 * and query, plus the current version of each tag.
 */
export const Cacheable = (options: CacheableOptions) =>
  SetMetadata(CACHEABLE_METADATA, options);

/**
 * Invalidate every cached entry that depends on the given tags after the
 * handler completes successfully. Use on create/update/delete endpoints.
 */
export const InvalidateCache = (...tags: string[]) =>
  SetMetadata(INVALIDATE_CACHE_METADATA, tags);
