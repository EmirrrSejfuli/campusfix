import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Issue } from '../issues/entities/issue.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  issue: Issue;

  @ManyToOne(() => User, { eager: true })
  author: User;

  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}
