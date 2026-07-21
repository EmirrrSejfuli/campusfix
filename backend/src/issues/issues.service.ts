import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus, IssueUrgency } from './entities/issue.entity';
import { User } from '../users/user.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { CategoriesService } from '../categories/categories.service';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Lang, t } from '../common/i18n';
import { WatchesService } from '../watches/watches.service';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    private categoriesService: CategoriesService,
    private aiService: AiService,
    private notificationsService: NotificationsService,
    private watchesService: WatchesService,
  ) {}

  async create(dto: CreateIssueDto, reportedBy: User, imageUrls: string[] = []): Promise<Issue> {
    // AI-assisted categorization: use the explicit category if given, otherwise let the AI suggest one
    let category = dto.categoryId ? await this.categoriesService.findById(dto.categoryId) : null;
    if (!category) {
      const suggestedName = this.aiService.suggestCategory(dto.title, dto.description);
      const all = await this.categoriesService.findAll();
      category = all.find((c) => c.name === suggestedName) ?? all[all.length - 1];
    }

    const urgency = this.aiService.estimateUrgency(dto.title, dto.description) as IssueUrgency;

    // Duplicate detection: compare against recent open reports in the same category
    const recentInCategory = await this.issuesRepository.find({
      where: { category: { id: category.id } },
      order: { createdAt: 'DESC' },
      take: 25,
    });
    const isPossibleDuplicate = recentInCategory.some((existing) =>
      this.aiService.isLikelyDuplicate(dto.title, existing.title),
    );

    const issue = this.issuesRepository.create({
      title: dto.title,
      description: dto.description,
      location: dto.location,
      latitude: dto.latitude,
      longitude: dto.longitude,
      imageUrl: imageUrls[0],
      imageUrlsJson: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      category,
      reportedBy,
      urgency,
      isPossibleDuplicate,
      status: IssueStatus.PENDING,
    });

    const saved = await this.issuesRepository.save(issue);

    // Notify anyone watching a matching location (independent of who reported it).
    if (saved.location) {
      const watchers = await this.watchesService.findWatchersForLocation(saved.location);
      for (const watch of watchers) {
        if (watch.user.id === reportedBy.id) continue; // don't notify the reporter about their own report
        await this.notificationsService.notify(watch.user, 'notif.watchedLocation', {
          location: watch.location,
          title: saved.title,
        });
      }
    }

    return saved;
  }

  async findAll(query: QueryIssueDto): Promise<Issue[]> {
    const qb = this.issuesRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.category', 'category')
      .leftJoinAndSelect('issue.reportedBy', 'reportedBy')
      .orderBy('issue.createdAt', 'DESC');

    if (query.status) qb.andWhere('issue.status = :status', { status: query.status });
    if (query.urgency) qb.andWhere('issue.urgency = :urgency', { urgency: query.urgency });
    if (query.categoryId) qb.andWhere('category.id = :categoryId', { categoryId: query.categoryId });
    if (query.mine) qb.andWhere('reportedBy.id = :mine', { mine: query.mine });
    if (query.search) {
      qb.andWhere('(issue.title ILIKE :search OR issue.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string, lang: Lang = 'sq'): Promise<Issue> {
    const issue = await this.issuesRepository.findOne({ where: { id } });
    if (!issue) throw new NotFoundException(t(lang, 'issueNotFound'));
    return issue;
  }

  async update(id: string, dto: UpdateIssueDto): Promise<Issue> {
    const issue = await this.findOne(id);
    if (dto.status) {
      issue.status = dto.status;
      if (dto.status === IssueStatus.RESOLVED) issue.resolvedAt = new Date();
    }
    if (dto.urgency) issue.urgency = dto.urgency;
    const saved = await this.issuesRepository.save(issue);

    if (dto.status) {
      await this.notificationsService.notify(issue.reportedBy, 'notif.statusUpdated', {
        title: issue.title,
        status: dto.status,
      });
    }
    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.issuesRepository.delete(id);
  }

  /** Aggregated statistics for the admin analytics dashboard. */
  async getAnalytics() {
    const total = await this.issuesRepository.count();

    const byStatusRaw = await this.issuesRepository
      .createQueryBuilder('issue')
      .select('issue.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('issue.status')
      .getRawMany();

    const byCategoryRaw = await this.issuesRepository
      .createQueryBuilder('issue')
      .leftJoin('issue.category', 'category')
      .select('category.name', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('category.name')
      .getRawMany();

    const byUrgencyRaw = await this.issuesRepository
      .createQueryBuilder('issue')
      .select('issue.urgency', 'urgency')
      .addSelect('COUNT(*)', 'count')
      .groupBy('issue.urgency')
      .getRawMany();

    const resolvedIssues = await this.issuesRepository.find({
      where: { status: IssueStatus.RESOLVED },
    });
    const avgResolutionHours =
      resolvedIssues.length > 0
        ? resolvedIssues.reduce((acc, i) => {
            const diffMs = new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime();
            return acc + diffMs / (1000 * 60 * 60);
          }, 0) / resolvedIssues.length
        : 0;

    return {
      total,
      byStatus: byStatusRaw,
      byCategory: byCategoryRaw,
      byUrgency: byUrgencyRaw,
      avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
    };
  }

  /** Daily report counts for the last N days — powers the dashboard trend chart. */
  async getTrend(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const raw = await this.issuesRepository
      .createQueryBuilder('issue')
      .select("TO_CHAR(issue.\"createdAt\", 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('issue.createdAt >= :since', { since })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    const countsByDay = new Map(raw.map((r) => [r.day, parseInt(r.count, 10)]));
    const result: { day: string; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ day: key, count: countsByDay.get(key) ?? 0 });
    }
    return result;
  }

  /** Top unresolved high-urgency reports, oldest first — surfaces what admins should act on now. */
  async getTopUrgent(limit = 3): Promise<Issue[]> {
    return this.issuesRepository.find({
      where: [
        { urgency: IssueUrgency.HIGH, status: IssueStatus.PENDING },
        { urgency: IssueUrgency.HIGH, status: IssueStatus.IN_PROGRESS },
      ],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /** Student self-service: edit own report, only while it is still pending. */
  async updateOwn(
    id: string,
    userId: string,
    changes: { title?: string; description?: string; location?: string },
    lang: Lang = 'sq',
  ): Promise<Issue> {
    const issue = await this.findOne(id, lang);
    if (issue.reportedBy.id !== userId) {
      throw new ForbiddenException(t(lang, 'editOwnOnly'));
    }
    if (issue.status !== IssueStatus.PENDING) {
      throw new ForbiddenException(t(lang, 'editPendingOnly'));
    }
    Object.assign(issue, changes);
    return this.issuesRepository.save(issue);
  }

  /** Student self-service: cancel (delete) own report, only while it is still pending. */
  async removeOwn(id: string, userId: string, lang: Lang = 'sq'): Promise<void> {
    const issue = await this.findOne(id, lang);
    if (issue.reportedBy.id !== userId) {
      throw new ForbiddenException(t(lang, 'cancelOwnOnly'));
    }
    if (issue.status !== IssueStatus.PENDING) {
      throw new ForbiddenException(t(lang, 'cancelPendingOnly'));
    }
    await this.issuesRepository.delete(id);
  }

  /** Lightweight list of geo-tagged issues for the campus map view. */
  async getMapPoints() {
    return this.issuesRepository
      .createQueryBuilder('issue')
      .leftJoin('issue.category', 'category')
      .select([
        'issue.id',
        'issue.title',
        'issue.status',
        'issue.urgency',
        'issue.latitude',
        'issue.longitude',
        'issue.location',
      ])
      .addSelect('category.name', 'categoryName')
      .where('issue.latitude IS NOT NULL AND issue.longitude IS NOT NULL')
      .getRawMany();
  }

  /** Report counts grouped by location text — surfaces recurring problem spots. */
  async getByLocation(limit = 10) {
    return this.issuesRepository
      .createQueryBuilder('issue')
      .select('issue.location', 'location')
      .addSelect('COUNT(*)', 'count')
      .where('issue.location IS NOT NULL')
      .groupBy('issue.location')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /** Applies the same status/urgency change to several reports at once (admin bulk action). */
  async bulkUpdate(ids: string[], changes: { status?: IssueStatus; urgency?: IssueUrgency }): Promise<Issue[]> {
    const results: Issue[] = [];
    for (const id of ids) {
      const issue = await this.issuesRepository.findOne({ where: { id } });
      if (!issue) continue;
      if (changes.status) {
        issue.status = changes.status;
        if (changes.status === IssueStatus.RESOLVED) issue.resolvedAt = new Date();
      }
      if (changes.urgency) issue.urgency = changes.urgency;
      results.push(await this.issuesRepository.save(issue));

      if (changes.status) {
        await this.notificationsService.notify(issue.reportedBy, 'notif.statusUpdated', {
          title: issue.title,
          status: changes.status,
        });
      }
    }
    return results;
  }

  /** No-auth summary powering the public /stats page — aggregate numbers only, no personal data. */
  async getPublicStats() {
    const total = await this.issuesRepository.count();
    const resolved = await this.issuesRepository.count({ where: { status: IssueStatus.RESOLVED } });
    const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 1000) / 10;

    const byCategoryRaw = await this.issuesRepository
      .createQueryBuilder('issue')
      .leftJoin('issue.category', 'category')
      .select('category.name', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('category.name')
      .getRawMany();

    return { total, resolved, resolutionRate, byCategory: byCategoryRaw };
  }
}
