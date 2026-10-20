import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheKeyBuilder } from './cache-key.builder';
import { CacheService } from './cache.service';
import { CacheInvalidationInterceptor } from './cache-invalidation.interceptor';
import { HttpCacheInterceptor } from './http-cache.interceptor';
import { ValkeyService } from './valkey.service';

@Global()
@Module({
  providers: [
    ValkeyService,
    CacheKeyBuilder,
    CacheService,
    { provide: APP_INTERCEPTOR, useClass: HttpCacheInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CacheInvalidationInterceptor },
  ],
  exports: [ValkeyService, CacheService, CacheKeyBuilder],
})
export class CacheModule {}
