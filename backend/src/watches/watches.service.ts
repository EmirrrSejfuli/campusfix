import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Watch } from './watch.entity';
import { User } from '../users/user.entity';
import { Lang, t } from '../common/i18n';

@Injectable()
export class WatchesService {
  constructor(
    @InjectRepository(Watch)
    private watchesRepository: Repository<Watch>,
  ) {}

  async create(user: User, location: string, lang: Lang = 'sq'): Promise<Watch> {
    const trimmed = location.trim();
    const existing = await this.watchesRepository.findOne({
      where: { user: { id: user.id }, location: ILike(trimmed) },
    });
    if (existing) throw new ConflictException(t(lang, 'watchLocationExists'));

    const watch = this.watchesRepository.create({ user, location: trimmed });
    return this.watchesRepository.save(watch);
  }

  async findForUser(userId: string): Promise<Watch[]> {
    return this.watchesRepository.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.watchesRepository.delete({ id, user: { id: userId } });
  }

  /** Finds watchers whose watched keyword appears within the given issue's location text. */
  async findWatchersForLocation(issueLocation: string): Promise<Watch[]> {
    if (!issueLocation) return [];
    const all = await this.watchesRepository.find({ relations: ['user'] });
    const target = issueLocation.toLowerCase();
    return all.filter((w) => target.includes(w.location.toLowerCase()));
  }
}
