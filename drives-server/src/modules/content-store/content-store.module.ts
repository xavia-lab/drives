import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { ContentStoreService } from './services/content-store.service';
import { ContentStoreMaintenanceService } from './content-store-maintenance.service';
import { ContentStoreGcService } from './content-store-gc.service';
import { Media } from '../media/entities/media.entity';
import { FileController } from './controllers/file.controller';
import { CONTENT_STORE_PROVIDER } from './interfaces/content-store-provider.interface';
import { ContentStoreConfig } from './interfaces/content-store-config.interface';
import { createContentStoreProvider } from './providers/content-store-provider.factory';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([Media])],
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
    ContentStoreGcService,
  ],
  controllers: [FileController],
  exports: [
    ContentStoreService,
    ContentStoreMaintenanceService,
    ContentStoreGcService,
  ],
})
export class ContentStoreModule {}
