import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  // Serve static uploaded files (/uploads/photos, /uploads/documents)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin:
      corsOrigin === '*' || corsOrigin === 'true'
        ? true
        : corsOrigin.includes(',')
          ? corsOrigin.split(',').map((o) => o.trim())
          : corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global API prefix
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter for unified JSON error format
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Documentation setup (enabled in development or via ENABLE_SWAGGER=true)
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const enableSwagger =
    configService.get<string>('ENABLE_SWAGGER', 'false') === 'true' || nodeEnv !== 'production';

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Aemade Selam Sunday School Management System API')
      .setDescription(
        'አዕማደ ሰላም ሰንበት ትምህርት ቤት - Core REST API documentation for web portals and mobile applications.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter your JWT access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Aemade Selam API Docs',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
    logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`Aemade Selam API is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
