import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { User } from "../../entities/user.entity";
import { Expense } from "../../entities/expense.entity";
import { Income } from "../../entities/income.entity";
import { Client } from "../../entities/client.entity";
import { Invoice } from "../../entities/invoice.entity";
import { InvoiceItem } from "../../entities/invoice-item.entity";
import { Category } from "../../entities/category.entity";
import { Budget } from "../../entities/budget.entity";
import { Attachment } from "../../entities/attachment.entity";

export interface RegisterDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    private jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; token: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return { user, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return { user, token };
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
    return user || null;
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return { message: "If the email exists, a reset link will be sent" };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiresAt = resetTokenExpiresAt;
    await this.userRepository.save(user);

    // TODO: Send email with reset link
    // For now, log the token (in production, send via email service)
    console.log(`Password reset token for ${user.email}: ${resetToken}`);
    console.log(
      `Reset link: http://localhost:5173/reset-password?token=${resetToken}`,
    );

    return { message: "If the email exists, a reset link will be sent" };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string; token?: string }> {
    const user = await this.userRepository.findOne({
      where: { resetToken: resetPasswordDto.token },
    });

    if (!user) {
      throw new BadRequestException("Invalid reset token");
    }

    if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException("Reset token has expired");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    await this.userRepository.save(user);

    return { message: "Password has been reset successfully" };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    // For simplicity, token is the user ID (in production, use proper token verification)
    const user = await this.userRepository.findOne({
      where: { id: token },
    });

    if (!user) {
      throw new BadRequestException("Invalid verification token");
    }

    if (user.isEmailVerified) {
      throw new BadRequestException("Email already verified");
    }

    user.isEmailVerified = true;
    await this.userRepository.save(user);

    return { message: "Email verified successfully" };
  }

  async updateProfile(
    userId: string,
    updateData: { firstName?: string; lastName?: string; email?: string },
  ): Promise<{ user: Omit<User, "password">; token: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (updateData.firstName) {
      user.firstName = updateData.firstName;
    }

    if (updateData.lastName) {
      user.lastName = updateData.lastName;
    }

    if (updateData.email) {
      user.email = updateData.email;
    }

    await this.userRepository.save(user);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return { user: result, token };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return {
        message: "If the email exists, a verification link will be sent",
      };
    }

    if (user.isEmailVerified) {
      throw new BadRequestException("Email already verified");
    }

    // TODO: Send verification email
    console.log(
      `Verification link for ${email}: http://localhost:5173/verify-email?token=${user.id}`,
    );

    return { message: "If the email exists, a verification link will be sent" };
  }

  async deleteAccount(
    userId: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    // Verify password before destructive action
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Incorrect password");
    }

    // Delete all child entities explicitly in order (invoice items before invoices)
    await this.invoiceItemRepository
      .createQueryBuilder()
      .delete()
      .where(
        `"invoiceId" IN (SELECT "id" FROM invoices WHERE "userId" = :userId)`,
        { userId },
      )
      .execute();

    await this.attachmentRepository
      .createQueryBuilder()
      .delete()
      .where("userId = :userId", { userId })
      .execute();

    await this.expenseRepository
      .createQueryBuilder()
      .delete()
      .where("userId = :userId", { userId })
      .execute();

    await this.incomeRepository
      .createQueryBuilder()
      .delete()
      .where("userId = :userId", { userId })
      .execute();

    await this.invoiceRepository
      .createQueryBuilder()
      .delete()
      .where("userId = :userId", { userId })
      .execute();

    await this.clientRepository
      .createQueryBuilder()
      .delete()
      .where("userId = :userId", { userId })
      .execute();

    await this.budgetRepository
      .createQueryBuilder()
      .delete()
      .where("userId = :userId", { userId })
      .execute();

    await this.categoryRepository
      .createQueryBuilder()
      .delete()
      .where("userId = :userId", { userId })
      .execute();

    // Finally delete the user
    await this.userRepository
      .createQueryBuilder()
      .delete()
      .where("id = :userId", { userId })
      .execute();

    return { message: "Account deleted successfully" };
  }
}
