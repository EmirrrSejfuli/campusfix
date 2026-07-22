import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { AdminZone } from './admin-zone.entity';
import { User } from '../users/user.entity';
import { Lang, t } from '../common/i18n';

@Injectable()
export class AdminZonesService {
  constructor(
    @InjectRepository(AdminZone)
    private adminZonesRepository: Repository<AdminZone>,
  ) {}

  async create(admin: User, zone: string, lang: Lang = 'sq'): Promise<AdminZone> {
    const trimmed = zone.trim();
    const existing = await this.adminZonesRepository.findOne({
      where: { admin: { id: admin.id }, zone: ILike(trimmed) },
    });
    if (existing) throw new ConflictException(t(lang, 'watchLocationExists'));

    const adminZone = this.adminZonesRepository.create({ admin, zone: trimmed });
    return this.adminZonesRepository.save(adminZone);
  }

  async findForAdmin(adminId: string): Promise<AdminZone[]> {
    return this.adminZonesRepository.find({ where: { admin: { id: adminId } }, order: { createdAt: 'DESC' } });
  }

  async remove(id: string, adminId: string): Promise<void> {
    await this.adminZonesRepository.delete({ id, admin: { id: adminId } });
  }

  /** Finds the admin(s) whose assigned zone keyword appears within the given issue's location text. */
  async findResponsibleAdminsForLocation(issueLocation: string): Promise<AdminZone[]> {
    if (!issueLocation) return [];
    const all = await this.adminZonesRepository.find({ relations: ['admin'] });
    const target = issueLocation.toLowerCase();
    return all.filter((z) => target.includes(z.zone.toLowerCase()));
  }
}
