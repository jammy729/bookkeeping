import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { User } from "../../entities/user.entity";
import { Expense } from "../../entities/expense.entity";
import { Income } from "../../entities/income.entity";
import { Client } from "../../entities/client.entity";
import { Invoice } from "../../entities/invoice.entity";
import { InvoiceItem } from "../../entities/invoice-item.entity";
import { Category } from "../../entities/category.entity";
import { Budget } from "../../entities/budget.entity";
import { Attachment } from "../../entities/attachment.entity";

jest.mock("bcrypt");

function mockRepo() {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    })),
  };
}

describe("AuthService", () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: "user-1",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    password: "hashed-password",
    isActive: true,
    isEmailVerified: false,
    resetToken: null,
    resetTokenExpiresAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as User;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepo() },
        { provide: getRepositoryToken(Expense), useValue: mockRepo() },
        { provide: getRepositoryToken(Income), useValue: mockRepo() },
        { provide: getRepositoryToken(Client), useValue: mockRepo() },
        { provide: getRepositoryToken(Invoice), useValue: mockRepo() },
        { provide: getRepositoryToken(InvoiceItem), useValue: mockRepo() },
        { provide: getRepositoryToken(Category), useValue: mockRepo() },
        { provide: getRepositoryToken(Budget), useValue: mockRepo() },
        { provide: getRepositoryToken(Attachment), useValue: mockRepo() },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mock-jwt-token"),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.register({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
      });

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe("mock-jwt-token");
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });

    it("should throw ConflictException if email already exists", async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "password123",
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe("mock-jwt-token");
    });

    it("should throw UnauthorizedException when user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException with wrong password", async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: "test@example.com",
          password: "wrong-password",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("validateUser", () => {
    it("should return user if found and active", async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser("user-1");

      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: "user-1", isActive: true },
      });
    });

    it("should return null if user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.validateUser("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("forgotPassword", () => {
    it("should generate reset token for existing user", async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.forgotPassword({
        email: "test@example.com",
      });

      expect(result.message).toContain("reset link");
      expect(userRepo.save).toHaveBeenCalled();
      expect(mockUser.resetToken).toBeDefined();
      expect(mockUser.resetTokenExpiresAt).toBeDefined();
    });

    it("should not reveal if email does not exist", async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: "nonexistent@example.com",
      });

      expect(result.message).toContain("reset link");
    });
  });

  describe("resetPassword", () => {
    it("should reset password with valid token", async () => {
      const userWithToken = {
        ...mockUser,
        resetToken: "valid-token",
        resetTokenExpiresAt: new Date(Date.now() + 3600000),
      };
      userRepo.findOne.mockResolvedValue(userWithToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue("new-hashed-password");
      userRepo.save.mockResolvedValue({
        ...userWithToken,
        password: "new-hashed-password",
      });

      const result = await service.resetPassword({
        token: "valid-token",
        newPassword: "new-password",
      });

      expect(result.message).toContain("reset successfully");
      expect(bcrypt.hash).toHaveBeenCalledWith("new-password", 10);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it("should throw BadRequestException for invalid token", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: "invalid-token",
          newPassword: "new-password",
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for expired token", async () => {
      const expiredUser = {
        ...mockUser,
        resetToken: "expired-token",
        resetTokenExpiresAt: new Date(Date.now() - 3600000),
      };
      userRepo.findOne.mockResolvedValue(expiredUser);

      await expect(
        service.resetPassword({
          token: "expired-token",
          newPassword: "new-password",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateProfile", () => {
    it("should update user profile and return new token", async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      userRepo.save.mockResolvedValue({ ...mockUser, firstName: "Jane" });

      const result = await service.updateProfile("user-1", {
        firstName: "Jane",
      });

      expect(result.user.firstName).toBe("Jane");
      expect(result.token).toBe("mock-jwt-token");
    });

    it("should throw if user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile("nonexistent", { firstName: "Jane" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteAccount", () => {
    it("should delete account with correct password", async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepo.createQueryBuilder = jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      })) as any;

      const result = await service.deleteAccount("user-1", "password123");

      expect(result.message).toBe("Account deleted successfully");
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashed-password",
      );
    });

    it("should throw UnauthorizedException with wrong password", async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.deleteAccount("user-1", "wrong-password"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw BadRequestException if user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteAccount("nonexistent", "password123"),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
