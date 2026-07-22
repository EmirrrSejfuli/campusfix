import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AdminZonesService } from './admin-zones.service';
import { UsersService } from '../users/users.service';
import { resolveLang } from '../common/i18n';

class CreateAdminZoneDto {
  @IsString()
  @MinLength(2)
  zone: string;
}

@Controller('admin-zones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminZonesController {
  constructor(
    private adminZonesService: AdminZonesService,
    private usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() dto: CreateAdminZoneDto, @Req() req) {
    const lang = resolveLang(req);
    const admin = await this.usersService.findById(req.user.userId, lang);
    return this.adminZonesService.create(admin, dto.zone, lang);
  }

  @Get('mine')
  findMine(@Req() req) {
    return this.adminZonesService.findForAdmin(req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.adminZonesService.remove(id, req.user.userId);
  }
}
