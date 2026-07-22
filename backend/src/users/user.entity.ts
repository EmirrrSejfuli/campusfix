import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Issue } from '../issues/entities/issue.entity';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // hashed with bcrypt

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ nullable: true })
  studentIndex: string; // e.g. university index number

  @Column({ nullable: true, type: 'text' })
  resetPasswordTokenHash: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  resetPasswordExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Issue, (issue) => issue.reportedBy)
  issues: Issue[];
}
