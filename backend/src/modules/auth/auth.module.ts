import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { User } from "../../entities/user.entity";
import { Expense } from "../../entities/expense.entity";
import { Income } from "../../entities/income.entity";
import { Client } from "../../entities/client.entity";
import { Invoice } from "../../entities/invoice.entity";
import { InvoiceItem } from "../../entities/invoice-item.entity";
import { Category } from "../../entities/category.entity";
import { Budget } from "../../entities/budget.entity";
import { Attachment } from "../../entities/attachment.entity";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "../../strategies/jwt.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Expense,
      Income,
      Client,
      Invoice,
      InvoiceItem,
      Category,
      Budget,
      Attachment,
    ]),
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRATION", "1d"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
