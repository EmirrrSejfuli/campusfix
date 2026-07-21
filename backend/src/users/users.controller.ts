import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from '../issues/entities/issue.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    @InjectRepository(Issue) private issuesRepository: Repository<Issue>,
  ) {}

  @Get('me')
  async me(@Req() req) {
    const user = await this.usersService.findById(req.user.userId);
    return { id: user.id, fullName: user.fullName, email: user.email, role: user.role, studentIndex: user.studentIndex, createdAt: user.createdAt };
  }

  @Get('me/stats')
  async myStats(@Req() req) {
    const userId = req.user.userId;
    const total = await this.issuesRepository.count({ where: { reportedBy: { id: userId } } });
    const resolved = await this.issuesRepository.count({
      where: { reportedBy: { id: userId }, status: IssueStatus.RESOLVED },
    });
    const pending = await this.issuesRepository.count({
      where: { reportedBy: { id: userId }, status: IssueStatus.PENDING },
    });
    const inProgress = await this.issuesRepository.count({
      where: { reportedBy: { id: userId }, status: IssueStatus.IN_PROGRESS },
    });
    return { total, resolved, pending, inProgress };
  }
}
