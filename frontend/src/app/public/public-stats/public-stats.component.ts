import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IssuesService } from '../../core/services/issues.service';
import { TranslationService } from '../../core/services/translation.service';
import { PublicStats } from '../../core/models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { Lang, LANG_NAMES } from '../../core/i18n/translations';

@Component({
  selector: 'app-public-stats',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <h1>{{ 'publicStats.title' | translate }}</h1>
      <p class="subtitle">{{ 'publicStats.subtitle' | translate }}</p>

      <div class="stats-grid" *ngIf="stats">
        <div class="card stat">
          <span class="value">{{ stats.total }}</span>
          <span class="label">{{ 'publicStats.total' | translate }}</span>
        </div>
        <div class="card stat">
          <span class="value" style="color: var(--success)">{{ stats.resolved }}</span>
          <span class="label">{{ 'publicStats.resolved' | translate }}</span>
        </div>
        <div class="card stat">
          <span class="value" style="color: var(--accent)">{{ stats.resolutionRate }}%</span>
          <span class="label">{{ 'publicStats.rate' | translate }}</span>
        </div>
      </div>

      <div class="card" *ngIf="stats && stats.byCategory.length > 0">
        <h3>{{ 'publicStats.byCategory' | translate }}</h3>
        <div class="bar-row" *ngFor="let c of stats.byCategory">
          <span class="bar-label">{{ translation.categoryName(c.category) }}</span>
          <div class="bar-track"><div class="bar-fill" [style.width.%]="percent(c.count)"></div></div>
          <span class="bar-count">{{ c.count }}</span>
        </div>
      </div>

      <a routerLink="/login" class="back-link">{{ 'publicStats.backToLogin' | translate }}</a>
    </div>
  `,
  styles: [`
    .page { max-width: 640px; margin: 0 auto; padding: 40px 20px; }
    .lang-switch { display: flex; justify-content: flex-end; gap: 6px; margin-bottom: 20px; }
    .lang-switch button {
      padding: 5px 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface);
      color: var(--ink-soft); font-family: var(--font-mono); font-size: 11px; font-weight: 600;
    }
    .lang-switch button.active { color: var(--accent); border-color: var(--accent); background: var(--accent-bg); }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .mark { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: var(--brand-ink); color: #fff; font-family: var(--font-mono); font-weight: 600; font-size: 12px; border-radius: 6px; }
    .wordmark { font-family: var(--font-display); font-weight: 700; font-size: 18px; color: var(--ink); }
    h1 { font-size: 24px; margin: 0 0 8px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 26px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px; }
    .stat { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 22px 16px; }
    .stat .value { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--ink); }
    .stat .label { font-size: 12px; color: var(--ink-soft); font-weight: 600; text-align: center; }
    h3 { margin: 0 0 14px; font-size: 14.5px; color: var(--ink); font-weight: 600; }
    .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 11px; }
    .bar-label { width: 130px; font-size: 12px; color: var(--ink-soft); flex-shrink: 0; }
    .bar-track { flex: 1; height: 7px; background: var(--paper); border-radius: 6px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--accent); border-radius: 6px; }
    .bar-count { width: 24px; text-align: right; font-size: 12px; font-weight: 600; font-family: var(--font-mono); color: var(--ink); }
    .back-link { display: inline-block; margin-top: 24px; color: var(--accent); font-size: 13.5px; text-decoration: none; font-weight: 600; }
    @media (max-width: 500px) { .stats-grid { grid-template-columns: 1fr; } }
  `],
})
export class PublicStatsComponent implements OnInit {
  stats: PublicStats | null = null;
  langs: Lang[] = ['sq', 'en', 'mk'];
  langNames = LANG_NAMES;

  constructor(private issuesService: IssuesService, public translation: TranslationService) {}

  ngOnInit(): void {
    this.issuesService.getPublicStats().subscribe((s) => (this.stats = s));
  }

  percent(count: string): number {
    if (!this.stats || this.stats.total === 0) return 0;
    return (parseInt(count, 10) / this.stats.total) * 100;
  }
}
