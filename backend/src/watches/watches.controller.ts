import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WatchesService } from './watches.service';
import { UsersService } from '../users/users.service';
import { resolveLang } from '../common/i18n';

class CreateWatchDto {
  @IsString()
  @MinLength(2)
  location: string;
}

@Controller('watches')
@UseGuards(JwtAuthGuard)
export class WatchesController {
  constructor(
    private watchesService: WatchesService,
    private usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() dto: CreateWatchDto, @Req() req) {
    const lang = resolveLang(req);
    const user = await this.usersService.findById(req.user.userId, lang);
    return this.watchesService.create(user, dto.location, lang);
  }

  @Get('mine')
  findMine(@Req() req) {
    return this.watchesService.findForUser(req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.watchesService.remove(id, req.user.userId);
  }
}
