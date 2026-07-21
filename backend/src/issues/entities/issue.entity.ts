import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Category } from '../../categories/category.entity';

export enum IssueStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum IssueUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  location: string; // free-text location; latitude/longitude reserved for Google Maps integration

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  imageUrl: string; // kept for backward compatibility — always equals imageUrls[0] when present

  @Column({ type: 'text', nullable: true })
  imageUrlsJson: string | null; // JSON-encoded array of all uploaded photo URLs (up to 4)

  @Column({ type: 'enum', enum: IssueStatus, default: IssueStatus.PENDING })
  status: IssueStatus;

  @Column({ type: 'enum', enum: IssueUrgency, default: IssueUrgency.LOW })
  urgency: IssueUrgency;

  @Column({ default: false })
  isPossibleDuplicate: boolean;

  @ManyToOne(() => User, (user) => user.issues, { eager: true })
  reportedBy: User;

  @ManyToOne(() => Category, (category) => category.issues, { eager: true })
  category: Category;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;
}
