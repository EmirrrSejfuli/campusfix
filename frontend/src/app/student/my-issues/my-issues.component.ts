import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IssuesService } from '../../core/services/issues.service';
import { resolveImageUrl } from '../../core/services/api.config';
import { AuthService } from '../../core/services/auth.service';
import { Issue } from '../../core/models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-my-issues',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <h1>{{ 'myIssues.title' | translate }}</h1>
    <p class="subtitle">{{ 'myIssues.subtitle' | translate }}</p>

    <div class="empty" *ngIf="!loading && issues.length === 0">
      {{ 'myIssues.empty' | translate }}
    </div>

    <div class="list" *ngIf="!loading">
      <a class="card issue" *ngFor="let issue of issues" [class.urgent]="issue.urgency === 'high'" [routerLink]="['/issues', issue.id]">
        <img *ngIf="issue.imageUrl" [src]="resolve(issue.imageUrl)" alt="" />
        <div class="content">
          <div class="row">
            <div>
              <span class="ticket-id">#{{ ticketId(issue.id) }}</span>
              <h3>{{ issue.title }}</h3>
            </div>
            <span class="badge" [ngClass]="'badge-' + issue.status">{{ ('status.' + issue.status) | translate }}</span>
          </div>
          <p class="desc">{{ issue.description }}</p>
          <div class="meta">
            <span class="badge badge-{{issue.urgency}}">{{ ('urgency.' + issue.urgency) | translate }}</span>
            <span class="cat">{{ translation.categoryName(issue.category?.name) }}</span>
            <span class="loc" *ngIf="issue.location">{{ issue.location }}</span>
            <span class="gps-tag" *ngIf="issue.latitude && issue.longitude" [title]="'detail.gpsLocation' | translate">📍 GPS</span>
            <span class="date">{{ issue.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <p class="dup" *ngIf="issue.isPossibleDuplicate">⚠ {{ 'manage.duplicateWarning' | translate }}</p>
          <p class="edit-hint" *ngIf="issue.status === 'pending'">{{ 'myIssues.editHint' | translate }}</p>
        </div>
      </a>
    </div>
  `,
  styles: [`
    h1 { font-size: 22px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 22px; }
    .empty { color: var(--ink-faint); text-align: center; padding: 40px; font-size: 14px; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .issue { display: flex; gap: 16px; border-left: 3px solid var(--line); text-decoration: none; color: inherit; transition: border-color 0.12s; }
    .issue:hover { border-color: var(--accent); }
    .issue.urgent { border-left-color: var(--danger); }
    .issue img { width: 92px; height: 92px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    .content { flex: 1; min-width: 0; }
    .row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .ticket-id { display: block; margin-bottom: 3px; }
    h3 { margin: 0; font-size: 15.5px; color: var(--ink); font-weight: 600; }
    .desc { color: var(--ink-soft); font-size: 13.5px; margin: 8px 0; line-height: 1.5; }
    .meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--ink-faint); flex-wrap: wrap; }
    .gps-tag { color: var(--success); font-weight: 600; }
    .dup { color: var(--warning); font-size: 12px; margin: 10px 0 0; font-weight: 600; }
    .edit-hint { color: var(--accent); font-size: 11.5px; margin: 8px 0 0; font-weight: 600; }
  `],
})
export class MyIssuesComponent implements OnInit {
  resolve(url?: string): string {
    return url ? resolveImageUrl(url) : '';
  }

  issues: Issue[] = [];
  loading = true;

  constructor(private issuesService: IssuesService, private auth: AuthService, public translation: TranslationService) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.id ?? '';
    this.issuesService.getIssues({ mine: userId }).subscribe({
      next: (issues) => {
        this.issues = issues;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  ticketId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }
}
