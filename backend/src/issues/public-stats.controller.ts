import { Controller, Get } from '@nestjs/common';
import { IssuesService } from './issues.service';

/**
 * Deliberately has NO guards — this is the public, no-login transparency page
 * (aggregate numbers only, no personal data), separate from the authenticated
 * IssuesController so the class-level @UseGuards there is never accidentally
 * bypassed for anything else.
 */
@Controller('public-stats')
export class PublicStatsController {
  constructor(private issuesService: IssuesService) {}

  @Get()
  getStats() {
    return this.issuesService.getPublicStats();
  }
}
