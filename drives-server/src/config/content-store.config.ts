import { registerAs } from '@nestjs/config';

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseDriver = (value?: string): 's3' | 'local' => {
  const driver = (value ?? 's3').trim().toLowerCase();
  if (driver !== 's3' && driver !== 'local') {
    throw new Error(
      `Unsupported content-store driver "${value}". Use "s3" or "local".`,
    );
  }
  return driver;
};

export default registerAs('contentStore', () => ({
  driver: parseDriver(
    process.env.DRIVES_BACKEND_CONTENT_STORE_DRIVER ??
      process.env.DRIVES_BACKEND_STORAGE_DRIVER,
  ),
  local: {
    root:
      process.env.DRIVES_BACKEND_CONTENT_STORE_LOCAL_PATH ??
      process.env.DRIVES_BACKEND_STORAGE_LOCAL_PATH ??
      'data/content-store',
    tmpMaxAgeMs: parseNumber(
      process.env.DRIVES_BACKEND_CONTENT_STORE_TMP_MAX_AGE_MS,
      60 * 60 * 1000,
    ),
    cleanupIntervalMs: parseNumber(
      process.env.DRIVES_BACKEND_CONTENT_STORE_CLEANUP_INTERVAL_MS,
      6 * 60 * 60 * 1000,
    ),
  },
  s3: {
    accessKeyId:
      process.env.DRIVES_BACKEND_CONTENT_STORE_S3_ACCESS_KEY_ID ??
      process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.DRIVES_BACKEND_CONTENT_STORE_S3_SECRET_ACCESS_KEY ??
      process.env.AWS_SECRET_ACCESS_KEY,
    region:
      process.env.DRIVES_BACKEND_CONTENT_STORE_S3_REGION ??
      process.env.AWS_REGION,
    bucket:
      process.env.DRIVES_BACKEND_CONTENT_STORE_S3_BUCKET ??
      process.env.AWS_S3_BUCKET,
    endpoint:
      process.env.DRIVES_BACKEND_CONTENT_STORE_S3_ENDPOINT ??
      process.env.AWS_S3_ENDPOINT,
  },
}));
