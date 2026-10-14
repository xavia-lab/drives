import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AWSStorageConfig } from './interfaces/aws-storage-config.interface';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { ContentAddressableStorageService } from './services/content-addressable-storage.service';
import { FileController } from './controllers/file.controller';

@Global()
@Module({
  providers: [
    {
      provide: 'STORAGE_PROVIDER', // The interface token
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const storageConfig = config.getOrThrow<AWSStorageConfig>('storage');

        return new S3StorageProvider({
          region: storageConfig.aws.region,
          key: storageConfig.aws.accessKeyId,
          secret: storageConfig.aws.secretAccessKey,
          endpoint: storageConfig.aws.s3.endpoint,
          bucket: storageConfig.aws.s3.bucket,
        });
      },
    },
    ContentAddressableStorageService,
  ],
  controllers: [FileController],
  exports: [ContentAddressableStorageService],
})
export class StorageModule {}
