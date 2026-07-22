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

  async setResetToken(userId: string, tokenHash: string, expires: Date): Promise<void> {
    await this.usersRepository.update(userId, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: expires,
    });
  }

  /** Finds a user with a matching, still-valid (non-expired) reset token hash. */
  async findByValidResetTokenHash(tokenHash: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { resetPasswordTokenHash: tokenHash } });
    if (!user || !user.resetPasswordExpires) return null;
    if (new Date(user.resetPasswordExpires).getTime() < Date.now()) return null;
    return user;
  }

  async updatePasswordAndClearResetToken(userId: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(userId, {
      password: hashed,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
    });
  }

  /** Increments the failed-login counter, locking the account temporarily after too many attempts. */
  async registerFailedLogin(userId: string, maxAttempts = 5, lockMinutes = 15): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return;
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const update: Partial<User> = { failedLoginAttempts: attempts };
    if (attempts >= maxAttempts) {
      update.lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
    }
    await this.usersRepository.update(userId, update);
  }

  async resetFailedLogins(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { failedLoginAttempts: 0, lockedUntil: null });
  }

  isAccountLocked(user: User): boolean {
    return !!user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now();
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async countAdmins(): Promise<number> {
    return this.usersRepository.count({ where: { role: UserRole.ADMIN } });
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    await this.usersRepository.update(userId, { role });
    return this.findById(userId);
  }
}
