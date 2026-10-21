export type ContentStoreDriver = 's3' | 'local';

export interface S3ContentStoreConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  key: string;
  secret: string;
  forcePathStyle: boolean;
}

export interface LocalContentStoreConfig {
  root: string;
  tmpMaxAgeMs: number;
  cleanupIntervalMs: number;
}

export interface ContentStoreConfig {
  driver: ContentStoreDriver;
  local: LocalContentStoreConfig;
  s3: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    bucket?: string;
    endpoint?: string;
    forcePathStyle?: boolean;
  };
}
