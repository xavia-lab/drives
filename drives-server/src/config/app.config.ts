import { registerAs } from '@nestjs/config';

// `process.env` values are always strings, so a raw "false" is truthy and would
// silently keep auth enabled. Parse explicit truthy/falsy tokens and return
// `undefined` when unset so the guards' default (`true`) still applies.
const parseBoolean = (value?: string): boolean | undefined => {
  if (value === undefined || value.trim() === '') return undefined;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
};

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: process.env.DRIVES_BACKEND_PORT,
  authEnabled: parseBoolean(process.env.DRIVES_BACKEND_AUTH_ENABLED),
  publicUrl: process.env.DRIVES_BACKEND_PUBLIC_URL,
}));
