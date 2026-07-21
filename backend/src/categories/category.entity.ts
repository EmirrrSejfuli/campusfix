import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Issue } from '../issues/entities/issue.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true, default: 'normal' })
  defaultUrgency: string; // used as a hint by the AI classification service

  @OneToMany(() => Issue, (issue) => issue.category)
  issues: Issue[];
}
