import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

/**
 * A "watch" lets a student follow a specific location (e.g. "Biblioteka" or
 * "Salla B3") without having reported an issue there themselves. When a new
 * issue is created at a matching location, every watcher is notified —
 * building a lightweight sense of shared awareness beyond one's own reports.
 */
@Entity('watches')
export class Watch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  location: string;

  @CreateDateColumn()
  createdAt: Date;
}
