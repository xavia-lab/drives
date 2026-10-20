import { registerAs } from '@nestjs/config';

const parseBoolean = (value?: string): boolean | undefined => {
  if (value === undefined || value.trim() === '') return undefined;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default registerAs('cache', () => {
  const nodeEnv = process.env.NODE_ENV;

  return {
    // Cache is disabled in unit tests unless explicitly opted in.
    enabled:
      parseBoolean(process.env.DRIVES_BACKEND_CACHE_ENABLED) ??
      nodeEnv !== 'test',
    url: process.env.DRIVES_BACKEND_VALKEY_URL ?? 'redis://localhost:6379',
    keyPrefix: process.env.DRIVES_BACKEND_CACHE_KEY_PREFIX ?? 'drives',
    defaultTtlMs: parseNumber(
      process.env.DRIVES_BACKEND_CACHE_DEFAULT_TTL_MS,
      15 * 60 * 1000,
    ),
    commandTimeoutMs: parseNumber(
      process.env.DRIVES_BACKEND_CACHE_COMMAND_TIMEOUT_MS,
      100,
    ),
    connectTimeoutMs: parseNumber(
      process.env.DRIVES_BACKEND_CACHE_CONNECT_TIMEOUT_MS,
      1000,
    ),
    maxResponseBytes: parseNumber(
      process.env.DRIVES_BACKEND_CACHE_MAX_RESPONSE_BYTES,
      256 * 1024,
    ),
  };
});
