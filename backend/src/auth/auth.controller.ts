import { Controller, Post, Body, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { resolveLang } from '../common/i18n';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto, @Req() req) {
    return this.authService.register(dto, resolveLang(req));
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Req() req) {
    return this.authService.login(dto, resolveLang(req));
  }
}
