import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum IncomeType {
  CONTRACTOR_PAYMENT = 'contractor_payment',
  FREELANCE = 'freelance',
  CONSULTING = 'consulting',
  OTHER = 'other',
}

@Entity('incomes')
@Index(['userId', 'date'])
export class Income {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: IncomeType,
    default: IncomeType.CONTRACTOR_PAYMENT,
  })
  type: IncomeType;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @ManyToOne(() => User, (user) => user.incomes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;

  @Column({ nullable: true })
  clientName: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column({ nullable: true })
  notes: string;

  // HST support (13%)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hstAmount: number;

  @Column({ default: false })
  includesHst: boolean;

  // Pay period in weeks (e.g., 2 for bi-weekly, 3 for 3-week pay)
  @Column({ nullable: true })
  payPeriodWeeks: number;

  @Column({ nullable: true })
  payPeriodCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
