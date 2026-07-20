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
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    database: process.env.DATABASE_NAME || "bookkeeping",
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
    synchronize: true,
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
