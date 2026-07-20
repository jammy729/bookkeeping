import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Expense } from "./expense.entity";
import { User } from "./user.entity";

export enum CategoryType {
  EXPENSE = "expense",
  INCOME = "income",
}

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: CategoryType,
    default: CategoryType.EXPENSE,
  })
  type: CategoryType;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ name: "userId" })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];
}
