import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { cors: true });

  const FE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const ADMIN_URL = process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174';
  const ALLOW_ALL_ORIGINS = process.env.CORS_ALLOW_ALL === 'true' || process.env.NGROK === 'true';
  app.enableCors({
    origin: ALLOW_ALL_ORIGINS
      ? true
      : (origin, callback) => {
          const whitelist = new Set<string>([
            FE_URL,
            ADMIN_URL,
            'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
          ]);
          if (!origin || whitelist.has(origin) || origin.endsWith('.ngrok-free.app') || origin.endsWith('.ngrok.app')) {
            callback(null, true);
          } else {
            callback(null, true);
          }
        },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const config = new DocumentBuilder()
    .setTitle('HRIS Dexa Group API')
    .setDescription('Employee WFH Attendance & HRD Monitoring System')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
  logger.log(`API docs: http://localhost:${port}/api`);
  logger.log(`CORS origins: ${FE_URL}, ${ADMIN_URL}`);
}

bootstrap();
