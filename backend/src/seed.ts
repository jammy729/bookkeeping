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
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../config/.env") });

async function bootstrap() {
  const url = process.env.DB_URL;
  if (!url) {
    throw new Error("DB_URL is required (set it in the root config/.env file)");
  }
  const dsOptions = {
    type: "postgres" as const,
    url,
    ssl: { rejectUnauthorized: false },
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
