import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Issue } from '../issues/entities/issue.entity';

/** "Më prek edhe mua" — lets other students confirm they're affected by an
 *  existing report, without creating a duplicate. One confirmation per user per issue. */
@Entity('confirmations')
@Unique(['issue', 'user'])
export class Confirmation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  issue: Issue;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
