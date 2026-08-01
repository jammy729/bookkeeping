import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import { Expense } from "./entities/expense.entity";
import { Income } from "./entities/income.entity";
import { Category } from "./entities/category.entity";
import { Client } from "./entities/client.entity";
import { Invoice } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { Attachment } from "./entities/attachment.entity";
import { Budget } from "./entities/budget.entity";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config();

async function bootstrap() {
  const url = process.env.DB_URL;
  const dsOptions = url
    ? { type: "postgres" as const, url, ssl: { rejectUnauthorized: false } }
    : {
        type: "postgres" as const,
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_DATABASE || "bookkeeping",
      };

  const dataSource = new DataSource({
    ...dsOptions,
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
  });

  await dataSource.initialize();
  console.log("Database connected and synchronized.");

  const userRepository = dataSource.getRepository(User);

  const testEmail = "test@example.com";
  const testPassword = "Test123!";

  const existingUser = await userRepository.findOne({
    where: { email: testEmail },
  });

  if (existingUser) {
    console.log("Test user already exists:", testEmail);
  } else {
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const user = userRepository.create({
      email: testEmail,
      firstName: "Test",
      lastName: "User",
      password: hashedPassword,
    });
    await userRepository.save(user);
    console.log("Test user created:");
    console.log("  Email:", testEmail);
    console.log("  Password:", testPassword);
  }

  await dataSource.destroy();
  process.exit(0);
}

bootstrap();
