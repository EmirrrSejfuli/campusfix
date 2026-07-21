import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './entities/issue.entity';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { PublicStatsController } from './public-stats.controller';
import { CategoriesModule } from '../categories/categories.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { WatchesModule } from '../watches/watches.module';

@Module({
  imports: [TypeOrmModule.forFeature([Issue]), CategoriesModule, AiModule, NotificationsModule, UsersModule, WatchesModule],
  providers: [IssuesService],
  controllers: [IssuesController, PublicStatsController],
  exports: [IssuesService],
})
export class IssuesModule {}
