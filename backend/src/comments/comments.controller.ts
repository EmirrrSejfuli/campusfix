import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { IssuesService } from '../issues/issues.service';
import { UsersService } from '../users/users.service';
import { resolveLang } from '../common/i18n';

class CreateCommentDto {
  @IsString()
  @MinLength(1)
  text: string;
}

@Controller('issues/:issueId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(
    private commentsService: CommentsService,
    private issuesService: IssuesService,
    private usersService: UsersService,
  ) {}

  @Get()
  findAll(@Param('issueId') issueId: string) {
    return this.commentsService.findForIssue(issueId);
  }

  @Post()
  async create(@Param('issueId') issueId: string, @Body() dto: CreateCommentDto, @Req() req) {
    const lang = resolveLang(req);
    const issue = await this.issuesService.findOne(issueId, lang);
    const author = await this.usersService.findById(req.user.userId, lang);
    return this.commentsService.create(issue, author, dto.text);
  }
}
