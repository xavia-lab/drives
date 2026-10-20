import { registerAs } from '@nestjs/config';

// Mirror the app config parsing so explicit "false"/"0"/"off" values are not
// treated as truthy strings.
const parseBoolean = (value?: string): boolean | undefined => {
  if (value === undefined || value.trim() === '') return undefined;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default registerAs('exchangeRate', () => {
  const nodeEnv = process.env.NODE_ENV;

  return {
    // Network access is disabled in tests unless explicitly opted in.
    enabled:
      parseBoolean(process.env.DRIVES_BACKEND_EXCHANGE_RATE_SYNC_ENABLED) ??
      nodeEnv !== 'test',
    apiUrl:
      process.env.DRIVES_BACKEND_EXCHANGE_RATE_API_URL ??
      'https://api.frankfurter.dev',
    timeoutMs: parseNumber(
      process.env.DRIVES_BACKEND_EXCHANGE_RATE_TIMEOUT_MS,
      10_000,
    ),
    retentionDays: parseNumber(
      process.env.DRIVES_BACKEND_EXCHANGE_RATE_RETENTION_DAYS,
      730,
    ),
  };
});
