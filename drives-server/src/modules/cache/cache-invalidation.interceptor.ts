import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { INVALIDATE_CACHE_METADATA } from './cache.decorators';

/**
 * Invalidates cache tags after a successful mutation. Cache failures are
 * fail-open: a write must never fail because Valkey is unavailable.
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.cache.isEnabled()) {
      return next.handle();
    }

    const tags = this.reflector.getAllAndOverride<string[]>(
      INVALIDATE_CACHE_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!tags || tags.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap(async (value: unknown) => {
        // Await invalidation so a read immediately after the write cannot see
        // the previous cached response. Failures remain fail-open.
        await this.cache.invalidateTags(tags).catch(() => undefined);
        return value;
      }),
    );
  }
}
