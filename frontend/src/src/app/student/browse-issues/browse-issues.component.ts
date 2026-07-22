import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IssuesService } from '../../core/services/issues.service';
import { resolveImageUrl } from '../../core/services/api.config';
import { Issue } from '../../core/models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-browse-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
    <h1>{{ 'browse.title' | translate }}</h1>
    <p class="subtitle">{{ 'browse.subtitle' | translate }}</p>

    <div class="search-bar card">
      <input [placeholder]="'browse.placeholder' | translate" [(ngModel)]="search" (ngModelChange)="onSearchChange()" autofocus />
    </div>

    <div class="list" *ngIf="issues.length > 0; else emptyState">
      <a class="card issue" *ngFor="let issue of issues" [routerLink]="['/issues', issue.id]">
        <img *ngIf="issue.imageUrl" [src]="resolve(issue.imageUrl)" alt="" />
        <div class="content">
          <div class="row">
            <span class="ticket-id">#{{ issue.id.slice(0,8).toUpperCase() }}</span>
            <span class="badge" [ngClass]="'badge-' + issue.status">{{ ('status.' + issue.status) | translate }}</span>
          </div>
          <h3>{{ issue.title }}</h3>
          <p class="desc">{{ issue.description }}</p>
          <span class="cat">{{ translation.categoryName(issue.category?.name) }}</span>
        </div>
      </a>
    </div>
    <ng-template #emptyState>
      <div class="empty">{{ (search ? 'browse.noResults' : 'browse.prompt') | translate }}</div>
    </ng-template>
  `,
  styles: [`
    h1 { font-size: 22px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 20px; }
    .search-bar { margin-bottom: 18px; padding: 10px; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .issue { display: flex; gap: 16px; text-decoration: none; color: inherit; transition: border-color 0.12s; }
    .issue:hover { border-color: var(--accent); }
    .issue img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    .content { flex: 1; min-width: 0; }
    .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    h3 { margin: 0 0 6px; font-size: 15px; color: var(--ink); font-weight: 600; }
    .desc { color: var(--ink-soft); font-size: 13px; margin: 0 0 6px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .cat { font-size: 12px; color: var(--ink-faint); }
    .empty { color: var(--ink-faint); text-align: center; padding: 50px; font-size: 14px; }
  `],
})
export class BrowseIssuesComponent implements OnInit {
  resolve(url?: string): string {
    return url ? resolveImageUrl(url) : '';
  }

  search = '';
  issues: Issue[] = [];
  private debounce: any;

  constructor(private issuesService: IssuesService, public translation: TranslationService) {}

  ngOnInit(): void {}

  onSearchChange(): void {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      if (!this.search.trim()) {
        this.issues = [];
        return;
      }
      this.issuesService.getIssues({ search: this.search }).subscribe((res) => (this.issues = res));
    }, 300);
  }
}
