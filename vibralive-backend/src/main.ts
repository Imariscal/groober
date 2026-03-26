import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationExceptionFilter } from '@/common/filters';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Important for webhook signature validation
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT') || 3001;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api';
  const corsOriginConfig = configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000,http://localhost:3001,http://localhost:3002';
  const corsOrigin = corsOriginConfig === '*' ? '*' : corsOriginConfig.split(',').map(origin => origin.trim());

  // JSON body middleware FIRST (must be before validation)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Enable CORS with proper configuration
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
      skipMissingProperties: false,
    }),
  );

  // Security headers
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    // Permitir conexiones desde localhost en desarrollo
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      res.setHeader('Content-Security-Policy', "default-src 'self' http://localhost:*; connect-src 'self' http://localhost:*");
    } else {
      res.setHeader('Content-Security-Policy', "default-src 'self'");
    }
    next();
  });

  // API prefix - Apply after CORS
  app.setGlobalPrefix(apiPrefix);

  // Start listening
  await app.listen(port, '0.0.0.0', () => {
    console.log(`
    🚀 VibraLive API Server Started!
    📍 Environment: ${configService.get('NODE_ENV') || 'development'}
    🔗 URL: http://localhost:${port}/${apiPrefix}
    ♥️  Health Check: http://localhost:${port}/${apiPrefix}/health
    `);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
