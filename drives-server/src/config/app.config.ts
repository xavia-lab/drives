import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: process.env.DRIVES_BACKEND_PORT,
  authEnabled: process.env.DRIVES_BACKEND_AUTH_ENABLED,
  publicUrl: process.env.DRIVES_BACKEND_PUBLIC_URL,
}));
