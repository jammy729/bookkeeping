import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { AppController } from "./app.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { IncomeModule } from "./modules/income/income.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { BudgetsModule } from "./modules/budgets/budgets.module";
import { User } from "./entities/user.entity";
import { Expense } from "./entities/expense.entity";
import { Income } from "./entities/income.entity";
import { Category } from "./entities/category.entity";
import { Client } from "./entities/client.entity";
import { Invoice } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { Attachment } from "./entities/attachment.entity";
import { Budget } from "./entities/budget.entity";

@Module({
  imports: [
    // ConfigModule for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Rate limiting (Throttler)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    // In-memory cache for aggregation endpoints (2 min TTL)
    CacheModule.register({
      ttl: 120000,
      max: 200,
    }),

    // TypeORM for PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("DATABASE_HOST", "localhost"),
        port: configService.get<number>("DATABASE_PORT", 5432),
        username: configService.get<string>("DATABASE_USER", "postgres"),
        password: configService.get<string>("DATABASE_PASSWORD", "postgres"),
        database: configService.get<string>("DATABASE_NAME", "bookkeeping"),
        entities: [
          User,
          Expense,
          Income,
          Category,
          Client,
          Invoice,
          InvoiceItem,
          Attachment,
          Budget,
        ],
        autoLoadEntities: true,
        synchronize: process.env.TYPEORM_SYNCHRONIZE === "true" || false,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    ExpensesModule,
    IncomeModule,
    CategoriesModule,
    ClientsModule,
    InvoicesModule,
    ReportsModule,
    UploadsModule,
    BudgetsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
