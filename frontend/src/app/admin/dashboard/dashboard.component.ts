import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IssuesService } from '../../core/services/issues.service';
import { TranslationService } from '../../core/services/translation.service';
import { Analytics, Issue, TrendPoint } from '../../core/models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <span class="eyebrow">{{ 'dash.eyebrow' | translate }}</span>
    <h1>{{ 'dash.title' | translate }}</h1>
    <p class="subtitle">{{ 'dash.subtitle' | translate }}</p>

    <div class="stats" *ngIf="analytics">
      <div class="stat">
        <span class="label">{{ 'dash.total' | translate }}</span>
        <span class="value">{{ analytics.total }}</span>
      </div>
      <div class="stat">
        <span class="label">{{ 'dash.avgResolution' | translate }}</span>
        <span class="value">{{ analytics.avgResolutionHours }}<span class="unit">{{ 'dash.hours' | translate }}</span></span>
      </div>
      <div class="stat stat-accent">
        <span class="label">{{ 'dash.highUrgency' | translate }}</span>
        <span class="value">{{ countFor(analytics.byUrgency, 'urgency', 'high') }}</span>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px" *ngIf="trend.length > 0">
      <h3>{{ 'dash.trend' | translate }}</h3>
      <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" class="trend-chart">
        <polyline [attr.points]="trendAreaPoints" class="trend-area" />
        <polyline [attr.points]="trendLinePoints" class="trend-line" />
      </svg>
      <div class="trend-labels">
        <span>{{ trend[0]?.day | date: 'dd/MM' }}</span>
        <span>{{ trend[trend.length - 1]?.day | date: 'dd/MM' }}</span>
      </div>
    </div>

    <div class="card urgent-panel" *ngIf="topUrgent.length > 0">
      <h3>{{ 'dash.topUrgent' | translate }}</h3>
      <a class="urgent-item" *ngFor="let issue of topUrgent" [routerLink]="['/issues', issue.id]">
        <span class="ticket-id">#{{ issue.id.slice(0,8).toUpperCase() }}</span>
        <span class="title">{{ issue.title }}</span>
        <span class="badge badge-high">{{ 'urgency.high' | translate }}</span>
      </a>
    </div>

    <div class="grid" *ngIf="analytics">
      <div class="card">
        <h3>{{ 'dash.byStatus' | translate }}</h3>
        <div class="bar-row" *ngFor="let s of analytics.byStatus">
          <span class="bar-label">{{ ('status.' + s.status) | translate }}</span>
          <div class="bar-track"><div class="bar-fill" [style.width.%]="percent(s.count)"></div></div>
          <span class="bar-count">{{ s.count }}</span>
        </div>
      </div>

      <div class="card">
        <h3>{{ 'dash.byCategory' | translate }}</h3>
        <div class="bar-row" *ngFor="let c of analytics.byCategory">
          <span class="bar-label">{{ translation.categoryName(c.category) }}</span>
          <div class="bar-track"><div class="bar-fill accent" [style.width.%]="percent(c.count)"></div></div>
          <span class="bar-count">{{ c.count }}</span>
        </div>
      </div>

      <div class="card" *ngIf="byLocation.length > 0">
        <h3>{{ 'dash.byLocation' | translate }}</h3>
        <div class="bar-row" *ngFor="let l of byLocation">
          <span class="bar-label">{{ l.location }}</span>
          <div class="bar-track"><div class="bar-fill location" [style.width.%]="locationPercent(l.count)"></div></div>
          <span class="bar-count">{{ l.count }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .eyebrow { display: inline-block; font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--info); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
    h1 { font-size: 22px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 22px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 14px; }
    .stat { display: flex; flex-direction: column; gap: 8px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 20px; }
    .stat-accent { border-color: var(--danger); background: var(--danger-bg); }
    .stat .label { font-size: 12.5px; color: var(--ink-soft); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
    .stat .value { font-family: var(--font-display); font-size: 30px; font-weight: 700; color: var(--ink); }
    .stat-accent .value { color: var(--danger); }
    .unit { font-size: 14px; font-weight: 500; color: var(--ink-soft); margin-left: 4px; }
    h3 { margin: 0 0 14px; font-size: 14.5px; color: var(--ink); font-family: var(--font-body); font-weight: 600; }
    .trend-chart { width: 100%; height: 120px; display: block; }
    .trend-area { fill: var(--accent-bg); stroke: none; }
    .trend-line { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .trend-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-faint); font-family: var(--font-mono); margin-top: 6px; }
    .urgent-panel { border-color: var(--danger); }
    .urgent-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); text-decoration: none; color: inherit; }
    .urgent-item:last-child { border-bottom: none; }
    .urgent-item .title { flex: 1; font-size: 13.5px; color: var(--ink); font-weight: 500; }
    .urgent-item:hover .title { color: var(--accent); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 11px; }
    .bar-label { width: 110px; font-size: 12px; color: var(--ink-soft); flex-shrink: 0; }
    .bar-track { flex: 1; height: 7px; background: var(--paper); border-radius: 6px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--info); border-radius: 6px; }
    .bar-fill.accent { background: var(--accent); }
    .bar-fill.location { background: var(--success); }
    .bar-count { width: 24px; text-align: right; font-size: 12px; font-weight: 600; font-family: var(--font-mono); color: var(--ink); }
    @media (max-width: 720px) { .grid, .stats { grid-template-columns: 1fr; } }
  `],
})
export class DashboardComponent implements OnInit {
  analytics: Analytics | null = null;
  trend: TrendPoint[] = [];
  topUrgent: Issue[] = [];
  byLocation: { location: string; count: string }[] = [];
  chartWidth = 600;
  chartHeight = 120;
  trendLinePoints = '';
  trendAreaPoints = '';

  constructor(private issuesService: IssuesService, public translation: TranslationService) {}

  ngOnInit(): void {
    this.issuesService.getAnalytics().subscribe((data) => (this.analytics = data));
    this.issuesService.getTopUrgent().subscribe((data) => (this.topUrgent = data));
    this.issuesService.getByLocation().subscribe((data) => (this.byLocation = data));
    this.issuesService.getTrend(30).subscribe((data) => {
      this.trend = data;
      this.buildChartPoints();
    });
  }

  private buildChartPoints(): void {
    if (this.trend.length === 0) return;
    const max = Math.max(...this.trend.map((t) => t.count), 1);
    const stepX = this.chartWidth / (this.trend.length - 1 || 1);
    const padding = 10;
    const usableHeight = this.chartHeight - padding * 2;
    const points = this.trend.map((t, i) => {
      const x = Math.round(i * stepX);
      const y = Math.round(padding + usableHeight - (t.count / max) * usableHeight);
      return `${x},${y}`;
    });
    this.trendLinePoints = points.join(' ');
    this.trendAreaPoints = `0,${this.chartHeight} ${points.join(' ')} ${this.chartWidth},${this.chartHeight}`;
  }

  countFor(arr: { count: string }[] | any[], key: string, value: string): string {
    const found = arr.find((item) => item[key] === value);
    return found ? found.count : '0';
  }

  percent(count: string): number {
    if (!this.analytics || this.analytics.total === 0) return 0;
    return (parseInt(count, 10) / this.analytics.total) * 100;
  }

  locationPercent(count: string): number {
    if (this.byLocation.length === 0) return 0;
    const max = Math.max(...this.byLocation.map((l) => parseInt(l.count, 10)));
    return max === 0 ? 0 : (parseInt(count, 10) / max) * 100;
  }
}
