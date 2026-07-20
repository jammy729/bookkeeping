import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get(getRepositoryToken(User));

  const testEmail = 'test@example.com';
  const testPassword = 'Test123!';

  // Check if test user already exists
  const existingUser = await userRepository.findOne({ where: { email: testEmail } });
  
  if (existingUser) {
    console.log('Test user already exists:', testEmail);
  } else {
    // Create test user
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const user = userRepository.create({
      email: testEmail,
      password: hashedPassword,
    });
    await userRepository.save(user);
    console.log('Test user created:');
    console.log('  Email:', testEmail);
    console.log('  Password:', testPassword);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
