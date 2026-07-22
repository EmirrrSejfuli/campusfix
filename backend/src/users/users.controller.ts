import { Controller, Get, Patch, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from '../issues/entities/issue.entity';

class UpdateRoleDto {
  @IsIn([UserRole.STUDENT, UserRole.ADMIN])
  role: UserRole;
}

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

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, createdAt: u.createdAt }));
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req) {
    // Safety net: never allow removing the last remaining admin — that would
    // permanently lock everyone out of the admin area (no more in-app way back in).
    if (dto.role === UserRole.STUDENT && id === req.user.userId) {
      const adminCount = await this.usersService.countAdmins();
      if (adminCount <= 1) {
        throw new ForbiddenException("S'mund ta hiqni rolin admin nga vetja juaj kur jeni administratori i vetëm.");
      }
    }
    return this.usersService.updateRole(id, dto.role);
  }
}
