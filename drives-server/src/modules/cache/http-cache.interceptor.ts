import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CACHEABLE_METADATA, CacheableOptions } from './cache.decorators';

/**
 * Caches successful GET responses. Runs globally so the cached value is the
 * already-serialized DTO (the route-level @Serialize interceptor maps first on
 * the response path). Guards run before interceptors, so auth is still applied.
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.cache.isEnabled()) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (request.method.toUpperCase() !== 'GET') {
      return next.handle();
    }

    const options = this.reflector.getAllAndOverride<CacheableOptions>(
      CACHEABLE_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      void this.handle(context, next, request, options)
        .then((observable) => observable.subscribe(subscriber))
        .catch(() => next.handle().subscribe(subscriber));
    });
  }

  private async handle(
    context: ExecutionContext,
    next: CallHandler,
    request: Request,
    options: CacheableOptions,
  ): Promise<Observable<unknown>> {
    const response = context.switchToHttp().getResponse<Response>();
    const tagVersions = await this.cache.getTagVersions(options.tags);
    const query: Record<string, unknown> = {
      ...(request.query as Record<string, unknown>),
    };

    if (options.private) {
      const user = (request as Request & { user?: { id?: string } }).user;
      query.__user = user?.id ?? 'anonymous';
    }

    const key = this.cache.buildKey({
      method: request.method,
      path: `${request.baseUrl}${request.path}`,
      query,
      tagVersions,
    });

    const cached = await this.cache.get(key);
    if (cached) {
      response.statusCode = cached.statusCode;
      response.setHeader('X-Cache', 'HIT');
      return of(cached.body);
    }

    response.setHeader('X-Cache', 'MISS');

    return next.handle().pipe(
      tap((body: unknown) => {
        if (
          body !== undefined &&
          response.statusCode >= 200 &&
          response.statusCode < 300
        ) {
          void this.cache
            .set(key, { statusCode: response.statusCode, body }, options.ttlMs)
            .catch(() => undefined);
        }
      }),
    );
  }
}
