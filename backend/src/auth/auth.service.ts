import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Lang, t } from '../common/i18n';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, lang: Lang = 'sq') {
    const user = await this.usersService.create(dto.fullName, dto.email, dto.password, dto.studentIndex, undefined, lang);
    return this.buildTokenResponse(user);
  }

  async login(dto: LoginDto, lang: Lang = 'sq') {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException(t(lang, 'invalidCredentials'));

    const isValid = await this.usersService.validatePassword(dto.password, user.password);
    if (!isValid) throw new UnauthorizedException(t(lang, 'invalidCredentials'));

    return this.buildTokenResponse(user);
  }

  private buildTokenResponse(user: { id: string; email: string; role: string; fullName: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    };
  }
}
