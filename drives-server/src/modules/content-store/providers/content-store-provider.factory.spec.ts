import { describe, expect, it } from 'vitest';
import { ContentStoreConfig } from '../interfaces/content-store-config.interface';
import {
  createContentStoreProvider,
  createProvider,
} from './content-store-provider.factory';
import { LocalContentStoreProvider } from './local-content-store.provider';
import { S3ContentStoreProvider } from './s3-content-store.provider';

const localConfig: ContentStoreConfig = {
  driver: 'local',
  gc: { enabled: true, graceMs: 86_400_000, batchSize: 500 },
  local: {
    root: '/tmp/drives-content-store',
    tmpMaxAgeMs: 3_600_000,
    cleanupIntervalMs: 21_600_000,
  },
  s3: {},
};

const s3Config: ContentStoreConfig = {
  driver: 's3',
  gc: { enabled: true, graceMs: 86_400_000, batchSize: 500 },
  local: {
    root: '/tmp/drives-content-store',
    tmpMaxAgeMs: 3_600_000,
    cleanupIntervalMs: 21_600_000,
  },
  s3: {
    region: 'us-east-1',
    accessKeyId: 'key',
    secretAccessKey: 'secret',
    bucket: 'bucket',
    endpoint: 'http://localhost:4566',
  },
};

describe('content-store provider factory', () => {
  it('creates the local provider', () => {
    expect(createContentStoreProvider(localConfig)).toBeInstanceOf(
      LocalContentStoreProvider,
    );
  });

  it('creates the S3 provider', () => {
    expect(createContentStoreProvider(s3Config)).toBeInstanceOf(
      S3ContentStoreProvider,
    );
  });

  it('rejects an unsupported driver', () => {
    expect(() => createProvider('unknown' as never, localConfig)).toThrow(
      /Unsupported content-store driver/,
    );
  });

  it('rejects incomplete S3 configuration', () => {
    expect(() =>
      createProvider('s3', {
        ...s3Config,
        s3: { ...s3Config.s3, bucket: '' },
      }),
    ).toThrow(/requires region, access key, secret key and bucket/);
  });

  it('rejects an empty local root', () => {
    expect(() =>
      createProvider('local', {
        ...localConfig,
        local: { ...localConfig.local, root: '' },
      }),
    ).toThrow(/requires a storage root path/);
  });
});
