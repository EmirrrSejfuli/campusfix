import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { Lang, t } from '../common/i18n';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    fullName: string,
    email: string,
    password: string,
    studentIndex?: string,
    role: UserRole = UserRole.STUDENT,
    lang: Lang = 'sq',
  ): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(t(lang, 'userExists'));
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ fullName, email, password: hashed, studentIndex, role });
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string, lang: Lang = 'sq'): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(t(lang, 'userNotFound'));
    return user;
  }

  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
