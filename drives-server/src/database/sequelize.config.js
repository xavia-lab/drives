
const config = {
  username: process.env.DRIVES_BACKEND_DATABASE_USERNAME,
  password: process.env.DRIVES_BACKEND_DATABASE_PASSWORD,
  database: process.env.DRIVES_BACKEND_DATABASE_NAME,
  host: process.env.DRIVES_BACKEND_DATABASE_HOST,
  port: parseInt(process.env.DRIVES_BACKEND_DATABASE_PORT, 10) || 5432,
  dialect: process.env.DRIVES_BACKEND_DATABASE_DIALECT || 'postgres',
  migrationStorageTableName: 'sequelize_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
};

module.exports = {
  development: config,
  test: {
    dialect: 'sqlite',
    storage: './test.sqlite',
  },
  production: {
    ...config,
    dialectOptions: {
      ssl: false,
      // ssl: { require: true, rejectUnauthorized: false },
    },
  },
};
