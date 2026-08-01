import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
import { User } from "../../entities/user.entity";
import * as bcrypt from "bcrypt";

export default class TestUserSeeder implements Seeder {
  track = true;

  public async run(
    dataSource: DataSource,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repository = dataSource.getRepository(User);

    const testEmail = "test@example.com";
    const testPassword = "Test123!";

    const existing = await repository.findOne({ where: { email: testEmail } });
    if (existing) {
      console.log("Test user already exists:", testEmail);
      return;
    }

    const hashedPassword = await bcrypt.hash(testPassword, 10);
    await repository.insert({
      email: testEmail,
      firstName: "Test",
      lastName: "User",
      password: hashedPassword,
    });
    console.log("Test user created:");
    console.log("  Email:", testEmail);
    console.log("  Password:", testPassword);
  }
}
