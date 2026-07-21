import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  /** Translation key (e.g. 'notif.statusUpdated') — the frontend translates this at render time,
   *  so the notification always displays in the reader's current language, regardless of which
   *  language the admin was using when the action happened. */
  @Column()
  messageKey: string;

  /** JSON-encoded parameters used to fill placeholders in the translated message (e.g. { title, status }). */
  @Column({ type: 'text', nullable: true })
  paramsJson: string | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
