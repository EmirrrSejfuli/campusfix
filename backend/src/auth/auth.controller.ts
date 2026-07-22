import { Controller, Post, Body, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    await this.authService.forgotPassword(dto.email, frontendUrl);
    // Always the same generic response, whether or not the email was found.
    return { message: 'Nëse email-i ekziston, do të merrni një link rivendosjeje brenda pak minutash.' };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Fjalëkalimi u ndryshua me sukses.' };
  }
}
