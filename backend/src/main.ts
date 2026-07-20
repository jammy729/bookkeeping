import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);

  // Security: Helmet for security headers
  app.use(helmet());

  // Security: Enable CORS with restricted origin
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Security: Rate limiting is configured in AppModule via ThrottlerModule

  // Security: Global validation pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: true,
    }),
  );

  // Swagger API documentation (disable in production)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Bookkeeping API')
      .setDescription('Bookkeeping application backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
    logger.log(`API Documentation: http://localhost:${configService.get('PORT', 3001)}/api`);
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', err.message);
  process.exit(1);
});
