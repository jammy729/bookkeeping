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
import { Category } from './category.entity';

@Entity('expenses')
@Index(['userId', 'date'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  description: string;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;

  @ManyToOne(() => Category, (category) => category.expenses, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ name: 'categoryId', nullable: true })
  categoryId: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  isRecurring: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
