import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { UpdateOwnIssueDto } from './dto/update-own-issue.dto';
import { BulkUpdateIssueDto } from './dto/bulk-update-issue.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { resolveLang, t } from '../common/i18n';
import { isValidImageContent } from '../common/file-security';
import { uploadImage } from '../common/image-storage';
import { Throttle } from '@nestjs/throttler';

const imageUploadOptions = {
  storage: memoryStorage(), // files stay in memory; uploadImage() sends them to Cloudinary or writes locally
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      const lang = resolveLang(req);
      return cb(new Error(lang === 'en' ? 'Only images (jpg, jpeg, png, webp) are allowed.' : lang === 'mk' ? 'Дозволени се само слики (jpg, jpeg, png, webp).' : 'Vetëm imazhe (jpg, jpeg, png, webp) lejohen.'), false);
    }
    cb(null, true);
  },
};

@Controller('issues')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IssuesController {
  constructor(
    private issuesService: IssuesService,
    private usersService: UsersService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // max 10 report submissions per minute per IP
  @UseInterceptors(FilesInterceptor('images', 4, imageUploadOptions))
  async create(@Body() dto: CreateIssueDto, @Req() req, @UploadedFiles() images?: Express.Multer.File[]) {
    const lang = resolveLang(req);
    const files = images ?? [];

    // Defense in depth: the fileFilter above only trusts the browser-declared
    // mimetype, which an attacker fully controls. Here we verify the actual
    // file bytes match a real image format before accepting the upload.
    for (const file of files) {
      if (!isValidImageContent(file.buffer)) {
        throw new BadRequestException(t(lang, 'imageOnly'));
      }
    }

    const user = await this.usersService.findById(req.user.userId, lang);
    const imageUrls = await Promise.all(files.map((f) => uploadImage(f.buffer, f.mimetype)));
    return this.issuesService.create(dto, user, imageUrls);
  }

  @Get()
  findAll(@Query() query: QueryIssueDto) {
    return this.issuesService.findAll(query);
  }

  @Get('analytics/summary')
  @Roles(UserRole.ADMIN)
  getAnalytics() {
    return this.issuesService.getAnalytics();
  }

  @Get('analytics/trend')
  @Roles(UserRole.ADMIN)
  getTrend(@Query('days') days?: string) {
    return this.issuesService.getTrend(days ? parseInt(days, 10) : 30);
  }

  @Get('analytics/top-urgent')
  @Roles(UserRole.ADMIN)
  getTopUrgent() {
    return this.issuesService.getTopUrgent(3);
  }

  @Get('analytics/by-location')
  @Roles(UserRole.ADMIN)
  getByLocation() {
    return this.issuesService.getByLocation(10);
  }

  @Get('map')
  getMapPoints() {
    return this.issuesService.getMapPoints();
  }

  @Patch('bulk')
  @Roles(UserRole.ADMIN)
  bulkUpdate(@Body() dto: BulkUpdateIssueDto) {
    return this.issuesService.bulkUpdate(dto.ids, { status: dto.status, urgency: dto.urgency });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.issuesService.findOne(id, resolveLang(req));
  }

  @Patch(':id/mine')
  updateOwn(@Param('id') id: string, @Body() dto: UpdateOwnIssueDto, @Req() req) {
    return this.issuesService.updateOwn(id, req.user.userId, dto, resolveLang(req));
  }

  @Delete(':id/mine')
  removeOwn(@Param('id') id: string, @Req() req) {
    return this.issuesService.removeOwn(id, req.user.userId, resolveLang(req));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.issuesService.remove(id);
  }
}
