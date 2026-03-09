import './instrument';

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SentryFilter } from './filters/sentry.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Required when running behind a reverse proxy (Traefik, Nginx, etc.)
  // Ensures correct client IP, HTTPS detection and secure headers
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableCors();

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Sentry Orchestration API')
    .setDescription(
      'API para teste de orquestração de agentes com Sentry, GitLab, N8N, Groq e Slack',
    )
    .setVersion('0.1.0')
    .addTag('status', 'Endpoints de status e saúde da aplicação')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 Application running on: http://localhost:${port}`);
  console.log(`📖 Swagger docs:            http://localhost:${port}/docs`);
  console.log(`❤️  Health check:            http://localhost:${port}/health\n`);
}

bootstrap();
