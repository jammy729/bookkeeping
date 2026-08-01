import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import * as dns from "dns";
import { AppModule } from "./app.module";
import { IpRestrictionMiddleware } from "./common/middleware/ip-restriction.middleware";

dns.setDefaultResultOrder("ipv4first");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  const configService = app.get(ConfigService);

  // Security: Helmet for security headers
  app.use(helmet());

  // Security: IP restriction for staging (set ALLOWED_IPS to enable)
  const allowedIps = configService.get<string>("ALLOWED_IPS", "");
  if (allowedIps) {
    const middleware = new IpRestrictionMiddleware();
    app.use(middleware.use.bind(middleware));
    logger.log(`IP restriction enabled for: ${allowedIps}`);
  }

  // Security: Enable CORS with restricted origin
  const frontendUrl = configService.get<string>(
    "FRONTEND_URL",
    process.env.FRONTEND_URL || "http://localhost:3000",
  );
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Set global API prefix
  app.setGlobalPrefix("api");

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
  if (configService.get<string>("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Bookkeeping API")
      .setDescription("Bookkeeping application backend API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api", app, document);
    logger.log(
      `API Documentation: http://localhost:${configService.get("PORT", 3001)}/api`,
    );
  }

  const port = configService.get<number>(
    "PORT",
    configService.get<number>("BACKEND_PORT", 3001),
  );
  await app.listen(port);
  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Environment: ${configService.get("NODE_ENV", "development")}`);
}

bootstrap().catch((err) => {
  const logger = new Logger("Bootstrap");
  logger.error("Failed to start application:", err.message);
  process.exit(1);
});
