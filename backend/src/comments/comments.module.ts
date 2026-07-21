import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { IssuesModule } from '../issues/issues.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), IssuesModule, UsersModule, NotificationsModule],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
