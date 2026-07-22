import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

/**
 * Assigns an admin as the responsible party for a location keyword
 * (e.g. "Biblioteka", "Salla 307"). Distinct from a student "Watch": this
 * represents operational responsibility/routing, not personal interest —
 * new reports at a matching location notify the responsible admin(s)
 * specifically, in addition to remaining visible to every admin in the
 * shared "Manage Reports" list.
 */
@Entity('admin_zones')
export class AdminZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  admin: User;

  @Column()
  zone: string;

  @CreateDateColumn()
  createdAt: Date;
}
