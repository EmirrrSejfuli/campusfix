import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '../users/user.entity';

/**
 * In-app notifications. In production this would also publish to
 * Firebase Cloud Messaging (per the Technology Stack) for push
 * notifications on mobile/web; the interface below is intentionally
 * kept push-provider-agnostic so that integration can be added later
 * inside notify() without touching calling code.
 *
 * Notifications are stored as a translation key + parameters (not final text),
 * so the same stored row renders correctly in whichever language the reader
 * currently has selected on the frontend.
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async notify(user: User, messageKey: string, params?: Record<string, string>): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      user,
      messageKey,
      paramsJson: params ? JSON.stringify(params) : null,
    });
    return this.notificationsRepository.save(notification);
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationsRepository.update(id, { isRead: true });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({ where: { user: { id: userId }, isRead: false } });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update({ user: { id: userId }, isRead: false }, { isRead: true });
  }
}
