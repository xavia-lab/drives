import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import morgan from 'morgan';
import helmet from 'helmet';
import { QueryParamsExceptionFilter } from './common/filters/query-params.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS Configuration
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'Accept',
      'X-Requested-With',
      'Content-Type',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Authorization',
    ],
    exposedHeaders: [
      'X-Pagination-Total-Count',
      'X-Pagination-Page-Count',
      'X-Pagination-Current-Page',
      'X-Pagination-Per-Page',
    ],
  });

  // Logging middleware - now morgan is directly callable
  if (configService.get('app.nodeEnv') === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true, // automatically transform payload to DTO instances (string → number, etc.)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new QueryParamsExceptionFilter());

  // API Versioning
  app.setGlobalPrefix('api', {
    exclude: ['system/*path'], // Excludes /system/version, /system/health, etc.
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger API Documentation (Development only)
  if (configService.get('app.nodeEnv') === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Iris Application API')
      .setDescription(
        'The Iris Application API documentation with Keycloak authentication',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter Keycloak JWT token',
          in: 'header',
        },
        'keycloak',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    logger.log('Swagger documentation available at /api/docs');
  }

  const port = configService.get<number>('app.port') || 5000;
  await app.listen(port);

  logger.log(`Server is running on port ${port}`);
  logger.log(`Environment: ${configService.get('app.nodeEnv')}`);
  logger.log(`Public URL: ${configService.get('app.publicUrl')}`);
  logger.log(`Auth enabled: ${configService.get('app.authEnabled')}`);
}
bootstrap();
