import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStoreService } from './services/content-store.service';
import { ContentStoreMaintenanceService } from './content-store-maintenance.service';
import { FileController } from './controllers/file.controller';
import { CONTENT_STORE_PROVIDER } from './interfaces/content-store-provider.interface';
import { ContentStoreConfig } from './interfaces/content-store-config.interface';
import { createContentStoreProvider } from './providers/content-store-provider.factory';

@Global()
@Module({
  providers: [
    {
      provide: CONTENT_STORE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createContentStoreProvider(
          config.getOrThrow<ContentStoreConfig>('contentStore'),
        ),
    },
    ContentStoreService,
    ContentStoreMaintenanceService,
  ],
  controllers: [FileController],
  exports: [ContentStoreService],
})
export class ContentStoreModule {}
