import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { Issue } from '../issues/entities/issue.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private notificationsService: NotificationsService,
  ) {}

  async create(issue: Issue, author: User, text: string): Promise<Comment> {
    const comment = this.commentsRepository.create({ issue, author, text: text.trim() });
    const saved = await this.commentsRepository.save(comment);

    // Notify the "other side" of the conversation: if the admin commented, notify the
    // reporter; if the reporter commented, this simple version has no admin-specific
    // targeting (any admin can review from the management dashboard).
    if (author.id !== issue.reportedBy.id) {
      await this.notificationsService.notify(issue.reportedBy, 'notif.newComment', { title: issue.title });
    }

    return saved;
  }

  async findForIssue(issueId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { issue: { id: issueId } },
      order: { createdAt: 'ASC' },
    });
  }
}
