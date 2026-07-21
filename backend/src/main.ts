import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  // Serve uploaded images statically at /uploads/*
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Interactive API documentation, available at /api/docs
  const config = new DocumentBuilder()
    .setTitle('CampusFix API')
    .setDescription('REST API for the CampusFix Smart Campus Issue Reporting Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`CampusFix API running on http://localhost:${port}/api`);
  console.log(`API docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
