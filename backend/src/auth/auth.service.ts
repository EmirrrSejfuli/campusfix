import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Lang, t } from '../common/i18n';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto, lang: Lang = 'sq') {
    const user = await this.usersService.create(dto.fullName, dto.email, dto.password, dto.studentIndex, undefined, lang);
    return this.buildTokenResponse(user);
  }

  async login(dto: LoginDto, lang: Lang = 'sq') {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException(t(lang, 'invalidCredentials'));

    if (this.usersService.isAccountLocked(user)) {
      const minutesLeft = Math.ceil((new Date(user.lockedUntil!).getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(t(lang, 'accountLocked').replace('{minutes}', String(minutesLeft)));
    }

    const isValid = await this.usersService.validatePassword(dto.password, user.password);
    if (!isValid) {
      await this.usersService.registerFailedLogin(user.id);
      throw new UnauthorizedException(t(lang, 'invalidCredentials'));
    }

    await this.usersService.resetFailedLogins(user.id);
    return this.buildTokenResponse(user);
  }

  /**
   * Always resolves successfully regardless of whether the email exists —
   * this prevents an attacker from using this endpoint to discover which
   * emails are registered (a common security requirement for this flow).
   */
  async forgotPassword(email: string, frontendUrl: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // silently succeed either way

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.usersService.setResetToken(user.id, tokenHash, expires);

    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await this.usersService.findByValidResetTokenHash(tokenHash);
    if (!user) throw new BadRequestException('Ky link ka skaduar ose është i pavlefshëm.');

    await this.usersService.updatePasswordAndClearResetToken(user.id, newPassword);
  }

  private buildTokenResponse(user: { id: string; email: string; role: string; fullName: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    };
  }
}
