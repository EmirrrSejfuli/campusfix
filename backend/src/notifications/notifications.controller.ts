import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findMine(@Req() req) {
    return this.notificationsService.findForUser(req.user.userId);
  }

  @Get('unread-count')
  unreadCount(@Req() req) {
    return this.notificationsService.unreadCount(req.user.userId).then((count) => ({ count }));
  }

  @Patch('read-all')
  markAllRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
