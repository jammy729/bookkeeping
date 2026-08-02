import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Expense } from "./expense.entity";
import { Income } from "./income.entity";
import { Client } from "./client.entity";
import { Invoice } from "./invoice.entity";
import { Attachment } from "./attachment.entity";
import { Budget } from "./budget.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true })
  resetTokenExpiresAt: Date;

  // Business profile (populated during onboarding). Nullable until the
  // user completes the onboarding flow; stored server-side so the profile
  // survives the apex -> admin zone handoff (admin persists the JWT, not
  // localStorage business data).
  @Column({ nullable: true })
  businessName: string;

  @Column({ nullable: true })
  businessType: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ type: "jsonb", nullable: true })
  taxSettings: Record<string, unknown> | null;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  fiscalYearStart: number;

  @Column({ default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @OneToMany(() => Income, (income) => income.user)
  incomes: Income[];

  @OneToMany(() => Client, (client) => client.user)
  clients: Client[];

  @OneToMany(() => Invoice, (invoice) => invoice.user)
  invoices: Invoice[];

  @OneToMany(() => Attachment, (attachment) => attachment.user)
  attachments: Attachment[];

  @OneToMany(() => Budget, (budget) => budget.user)
  budgets: Budget[];
}
