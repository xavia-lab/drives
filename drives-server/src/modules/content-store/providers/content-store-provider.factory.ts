import {
  ContentStoreConfig,
  ContentStoreDriver,
} from '../interfaces/content-store-config.interface';
import { ContentStoreProvider } from '../interfaces/content-store-provider.interface';
import { LocalContentStoreProvider } from './local-content-store.provider';
import { S3ContentStoreProvider } from './s3-content-store.provider';

export const createContentStoreProvider = (
  config: ContentStoreConfig,
): ContentStoreProvider => {
  return createProvider(config.driver, config);
};

export const createProvider = (
  driver: ContentStoreDriver,
  config: ContentStoreConfig,
): ContentStoreProvider => {
  if (driver === 'local') {
    if (!config.local.root) {
      throw new Error('Local content store requires a storage root path');
    }
    return new LocalContentStoreProvider(config.local.root);
  }

  if (driver === 's3') {
    const { region, accessKeyId, secretAccessKey, bucket, endpoint } =
      config.s3;
    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'S3 content store requires region, access key, secret key and bucket',
      );
    }

    return new S3ContentStoreProvider({
      region,
      key: accessKeyId,
      secret: secretAccessKey,
      bucket,
      endpoint,
      forcePathStyle: config.s3.forcePathStyle ?? true,
    });
  }

  throw new Error(`Unsupported content-store driver: ${String(driver)}`);
};
