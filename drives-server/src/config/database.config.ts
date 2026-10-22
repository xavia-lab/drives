import { registerAs } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Dialect } from 'sequelize'; // 👈 Import the explicit Dialect type union

export default registerAs('database', (): SequelizeModuleOptions => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  const portValue = process.env.DRIVES_BACKEND_DATABASE_PORT || '5432';

  // PostgreSQL SSL is opt-in. Keeping `ssl: false` explicit also prevents
  // `PGSSLMODE` in the environment from silently forcing TLS when the database
  // (for example the bundled Docker Postgres) does not support it.
  const sslEnabled = process.env.DB_SSL === 'true';

  // 1. Define Common/Base Settings
  const baseConfig: Partial<SequelizeModuleOptions> = {
    username: process.env.DRIVES_BACKEND_DATABASE_USERNAME,
    password: process.env.DRIVES_BACKEND_DATABASE_PASSWORD,
    database: process.env.DRIVES_BACKEND_DATABASE_NAME,
    host: process.env.DRIVES_BACKEND_DATABASE_HOST,
    // Docker env vars are ALWAYS strings, so parseInt is mandatory
    port: parseInt(portValue, 10),
    // Fixed: Cast directly to Dialect instead of using 'as any'
    dialect:
      (process.env.DRIVES_BACKEND_DATABASE_DIALECT as Dialect) || 'postgres',
    autoLoadModels: true,
    dialectOptions: {
      ssl: sslEnabled ? { require: true, rejectUnauthorized: false } : false,
    },
  };

  // 2. Define Environment Specific Overrides
  const environments: Record<string, SequelizeModuleOptions> = {
    development: {
      ...baseConfig,
      synchronize: true,
      logging: console.log,
    },
    test: {
      dialect: 'sqlite',
      storage: ':memory:',
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    },
    production: {
      ...baseConfig,
      synchronize: false, // Critical for production safety
      logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    },
  };

  // 3. Return the specific config for the current environment
  return environments[nodeEnv] || environments.development;
});
