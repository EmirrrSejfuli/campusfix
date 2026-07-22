import { ForbiddenException } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssueStatus, IssueUrgency } from './entities/issue.entity';

function buildService() {
  const issuesRepository: any = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 'saved-id', ...data })),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const confirmationsRepository: any = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  };
  const categoriesService: any = {
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue([{ id: 'cat-other', name: 'Tjetër' }]),
  };
  const aiService: any = {
    suggestCategory: jest.fn().mockReturnValue('Tjetër'),
    estimateUrgency: jest.fn().mockReturnValue('low'),
    isLikelyDuplicate: jest.fn().mockReturnValue(false),
  };
  const notificationsService: any = { notify: jest.fn() };
  const watchesService: any = { findWatchersForLocation: jest.fn().mockResolvedValue([]) };
  const adminZonesService: any = { findResponsibleAdminsForLocation: jest.fn().mockResolvedValue([]) };

  const service = new IssuesService(
    issuesRepository,
    confirmationsRepository,
    categoriesService,
    aiService,
    notificationsService,
    watchesService,
    adminZonesService,
  );

  return { service, issuesRepository, confirmationsRepository, categoriesService, aiService, notificationsService, watchesService, adminZonesService };
}

describe('IssuesService', () => {
  describe('create', () => {
    it('auto-assigns a category and urgency from the AI service when none is given', async () => {
      const { service, aiService } = buildService();
      const dto: any = { title: 'Dritat e prishura', description: 'Nuk punojnë dritat në sallë' };
      const reporter: any = { id: 'user-1' };

      const issue = await service.create(dto, reporter, []);

      expect(aiService.suggestCategory).toHaveBeenCalledWith(dto.title, dto.description);
      expect(aiService.estimateUrgency).toHaveBeenCalledWith(dto.title, dto.description);
      expect(issue.category.name).toBe('Tjetër');
    });

    it('flags a report as a possible duplicate when the AI detects a similar existing title', async () => {
      const { service, issuesRepository, aiService } = buildService();
      issuesRepository.find.mockResolvedValue([{ title: 'Dritat e prishura ne salle B3' }]);
      aiService.isLikelyDuplicate.mockReturnValue(true);

      const dto: any = { title: 'Dritat e prishura ne salle B3', description: 'Përsëri e njëjta gjë' };
      const issue = await service.create(dto, { id: 'user-1' } as any, []);

      expect(issue.isPossibleDuplicate).toBe(true);
    });

    it('notifies watchers of a matching location, excluding the reporter themself', async () => {
      const { service, watchesService, notificationsService } = buildService();
      const reporter: any = { id: 'reporter-1' };
      const watcherUser: any = { id: 'watcher-1' };
      watchesService.findWatchersForLocation.mockResolvedValue([
        { user: reporter, location: 'Biblioteka' },
        { user: watcherUser, location: 'Biblioteka' },
      ]);

      const dto: any = { title: 'Problem', description: 'Përshkrim', location: 'Biblioteka' };
      await service.create(dto, reporter, []);

      // Only the non-reporter watcher should be notified.
      expect(notificationsService.notify).toHaveBeenCalledTimes(1);
      expect(notificationsService.notify).toHaveBeenCalledWith(watcherUser, 'notif.watchedLocation', expect.any(Object));
    });

    it('notifies the admin responsible for a matching zone', async () => {
      const { service, adminZonesService, notificationsService } = buildService();
      const responsibleAdmin: any = { id: 'admin-1' };
      adminZonesService.findResponsibleAdminsForLocation.mockResolvedValue([
        { admin: responsibleAdmin, zone: 'Salla 307' },
      ]);

      const dto: any = { title: 'Drita e prishur', description: 'Përshkrim i gjatë problemi', location: 'Salla 307' };
      await service.create(dto, { id: 'reporter-1' } as any, []);

      expect(notificationsService.notify).toHaveBeenCalledWith(responsibleAdmin, 'notif.zoneReport', expect.any(Object));
    });
  });

  describe('rateIssue', () => {
    it('rejects rating from someone other than the reporter', async () => {
      const { service, issuesRepository } = buildService();
      issuesRepository.findOne.mockResolvedValue({
        id: 'issue-1',
        reportedBy: { id: 'owner-1' },
        status: IssueStatus.RESOLVED,
        satisfactionRating: null,
      });

      await expect(service.rateIssue('issue-1', 'someone-else', 5)).rejects.toThrow(ForbiddenException);
    });

    it('rejects rating an issue that is not yet resolved', async () => {
      const { service, issuesRepository } = buildService();
      issuesRepository.findOne.mockResolvedValue({
        id: 'issue-1',
        reportedBy: { id: 'owner-1' },
        status: IssueStatus.PENDING,
        satisfactionRating: null,
      });

      await expect(service.rateIssue('issue-1', 'owner-1', 5)).rejects.toThrow(ForbiddenException);
    });

    it('rejects rating an issue that was already rated', async () => {
      const { service, issuesRepository } = buildService();
      issuesRepository.findOne.mockResolvedValue({
        id: 'issue-1',
        reportedBy: { id: 'owner-1' },
        status: IssueStatus.RESOLVED,
        satisfactionRating: 4,
      });

      await expect(service.rateIssue('issue-1', 'owner-1', 5)).rejects.toThrow(ForbiddenException);
    });

    it('clamps out-of-range ratings into the 1-5 range', async () => {
      const { service, issuesRepository } = buildService();
      issuesRepository.findOne.mockResolvedValue({
        id: 'issue-1',
        reportedBy: { id: 'owner-1' },
        status: IssueStatus.RESOLVED,
        satisfactionRating: null,
      });

      const result = await service.rateIssue('issue-1', 'owner-1', 99);
      expect(result.satisfactionRating).toBe(5);
    });
  });

  describe('toggleConfirmation', () => {
    it('prevents the reporter from confirming their own issue', async () => {
      const { service, issuesRepository } = buildService();
      issuesRepository.findOne.mockResolvedValue({ id: 'issue-1', reportedBy: { id: 'owner-1' } });

      await expect(service.toggleConfirmation('issue-1', 'owner-1')).rejects.toThrow(ForbiddenException);
    });

    it('adds a confirmation for a different user and returns the updated count', async () => {
      const { service, issuesRepository, confirmationsRepository } = buildService();
      issuesRepository.findOne.mockResolvedValue({ id: 'issue-1', reportedBy: { id: 'owner-1' } });
      confirmationsRepository.findOne.mockResolvedValue(null); // not yet confirmed
      confirmationsRepository.count.mockResolvedValue(3);

      const result = await service.toggleConfirmation('issue-1', 'other-user');

      expect(confirmationsRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ confirmed: true, count: 3 });
    });

    it('removes an existing confirmation when toggled again', async () => {
      const { service, issuesRepository, confirmationsRepository } = buildService();
      issuesRepository.findOne.mockResolvedValue({ id: 'issue-1', reportedBy: { id: 'owner-1' } });
      confirmationsRepository.findOne.mockResolvedValue({ id: 'existing-confirmation' });
      confirmationsRepository.count.mockResolvedValue(2);

      const result = await service.toggleConfirmation('issue-1', 'other-user');

      expect(confirmationsRepository.delete).toHaveBeenCalledWith('existing-confirmation');
      expect(result).toEqual({ confirmed: false, count: 2 });
    });
  });
});
