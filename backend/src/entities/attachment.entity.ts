import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  entityType: string; // 'expense', 'invoice', 'receipt', etc.

  @Column({ nullable: true })
  entityId: string; // ID of the related entity

  @ManyToOne(() => User, (user) => user.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
