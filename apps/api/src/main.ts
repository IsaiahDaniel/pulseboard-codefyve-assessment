import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/exceptions/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      const isDev =
        !process.env.NODE_ENV ||
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'dev';
      if (
        isDev &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle('PulseBoard API')
    .setDescription(
      'Project & Task Management Platform — Codefyve Senior Lead assessment',
    )
    .setVersion('0.1.0')
    .addServer('/api/v1', 'API v1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.PORT ?? 4200);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`PulseBoard API on http://127.0.0.1:${port}`);
  // eslint-disable-next-line no-console
  console.log(`API base: http://127.0.0.1:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`Swagger: http://127.0.0.1:${port}/docs`);
}

bootstrap();
