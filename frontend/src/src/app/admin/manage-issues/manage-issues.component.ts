import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IssuesService } from '../../core/services/issues.service';
import { resolveImageUrl } from '../../core/services/api.config';
import { TranslationService } from '../../core/services/translation.service';
import { Category, Issue } from '../../core/models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

const OVERDUE_HOURS = 24;

@Component({
  selector: 'app-manage-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
    <h1>{{ 'manage.title' | translate }}</h1>
    <p class="subtitle">{{ 'manage.subtitle' | translate }}</p>

    <div class="filters card">
      <input [placeholder]="'manage.searchPlaceholder' | translate" [(ngModel)]="search" (ngModelChange)="applyFilters()" />
      <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
        <option value="">{{ 'manage.allStatuses' | translate }}</option>
        <option value="pending">{{ 'status.pending' | translate }}</option>
        <option value="in_progress">{{ 'status.in_progress' | translate }}</option>
        <option value="resolved">{{ 'status.resolved' | translate }}</option>
        <option value="rejected">{{ 'status.rejected' | translate }}</option>
      </select>
      <select [(ngModel)]="urgencyFilter" (ngModelChange)="applyFilters()">
        <option value="">{{ 'manage.allUrgencies' | translate }}</option>
        <option value="high">{{ 'urgency.high' | translate }}</option>
        <option value="medium">{{ 'urgency.medium' | translate }}</option>
        <option value="low">{{ 'urgency.low' | translate }}</option>
      </select>
      <select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilters()">
        <option value="">{{ 'manage.allCategories' | translate }}</option>
        <option *ngFor="let c of categories" [value]="c.id">{{ translation.categoryName(c.name) }}</option>
      </select>
    </div>

    <div class="bulk-bar card" *ngIf="selectedIds.size > 0">
      <span class="bulk-count">{{ selectedIds.size }} {{ 'manage.selected' | translate }}</span>
      <select [(ngModel)]="bulkStatus">
        <option value="">{{ 'manage.bulkStatus' | translate }}</option>
        <option value="pending">{{ 'status.pending' | translate }}</option>
        <option value="in_progress">{{ 'status.in_progress' | translate }}</option>
        <option value="resolved">{{ 'status.resolved' | translate }}</option>
        <option value="rejected">{{ 'status.rejected' | translate }}</option>
      </select>
      <select [(ngModel)]="bulkUrgency">
        <option value="">{{ 'manage.bulkUrgency' | translate }}</option>
        <option value="low">{{ 'urgency.low' | translate }}</option>
        <option value="medium">{{ 'urgency.medium' | translate }}</option>
        <option value="high">{{ 'urgency.high' | translate }}</option>
      </select>
      <button class="btn btn-primary" (click)="applyBulk()" [disabled]="(!bulkStatus && !bulkUrgency) || bulkLoading">
        {{ 'manage.bulkApply' | translate }}
      </button>
    </div>

    <label class="select-all">
      <input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll($event)" />
      {{ 'manage.selectAll' | translate }}
    </label>

    <div class="list">
      <div class="card issue" *ngFor="let issue of issues" [class.urgent]="issue.urgency === 'high'">
        <input type="checkbox" class="select-box" [checked]="selectedIds.has(issue.id)" (change)="toggleSelect(issue.id)" />
        <img *ngIf="issue.imageUrl" [src]="resolve(issue.imageUrl)" alt="" />
        <div class="content">
          <div class="row">
            <div>
              <span class="ticket-id">#{{ ticketId(issue.id) }}</span>
              <h3><a [routerLink]="['/issues', issue.id]">{{ issue.title }}</a></h3>
            </div>
            <div class="badge-group">
              <span class="badge badge-rejected" *ngIf="isOverdue(issue)">⚠ {{ 'sla.overdue' | translate }}</span>
              <span class="badge badge-{{issue.urgency}}">{{ ('urgency.' + issue.urgency) | translate }}</span>
            </div>
          </div>
          <p class="desc">{{ issue.description }}</p>
          <div class="meta">
            <span class="cat">{{ translation.categoryName(issue.category?.name) }}</span>
            <span class="loc" *ngIf="issue.location">{{ issue.location }}</span>
            <span class="by">{{ 'manage.reportedBy' | translate }} {{ issue.reportedBy?.fullName }}</span>
            <span class="date">{{ issue.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <p class="dup" *ngIf="issue.isPossibleDuplicate">⚠ {{ 'manage.duplicateWarning' | translate }}</p>

          <div class="actions">
            <select [(ngModel)]="issue.status" (ngModelChange)="updateStatus(issue)">
              <option value="pending">{{ 'status.pending' | translate }}</option>
              <option value="in_progress">{{ 'status.in_progress' | translate }}</option>
              <option value="resolved">{{ 'status.resolved' | translate }}</option>
              <option value="rejected">{{ 'status.rejected' | translate }}</option>
            </select>
            <select [(ngModel)]="issue.urgency" (ngModelChange)="updateUrgency(issue)">
              <option value="low">{{ 'urgency.low' | translate }}</option>
              <option value="medium">{{ 'urgency.medium' | translate }}</option>
              <option value="high">{{ 'urgency.high' | translate }}</option>
            </select>
            <button class="btn btn-danger" (click)="remove(issue)">{{ 'manage.delete' | translate }}</button>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="issues.length === 0">{{ 'manage.empty' | translate }}</div>
    </div>
  `,
  styles: [`
    h1 { font-size: 22px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 20px; }
    .filters { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .bulk-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; border-color: var(--accent); background: var(--accent-bg); flex-wrap: wrap; }
    .bulk-count { font-size: 13px; font-weight: 600; color: var(--accent); font-family: var(--font-mono); }
    .bulk-bar select { width: auto; }
    .select-all { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--ink-soft); margin-bottom: 12px; cursor: pointer; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .issue { display: flex; gap: 14px; align-items: flex-start; border-left: 3px solid var(--line); }
    .issue.urgent { border-left-color: var(--danger); }
    .select-box { margin-top: 4px; flex-shrink: 0; width: 16px; height: 16px; }
    .issue img { width: 96px; height: 96px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    .content { flex: 1; min-width: 0; }
    .row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .badge-group { display: flex; gap: 6px; flex-shrink: 0; }
    .ticket-id { display: block; margin-bottom: 3px; }
    h3 { margin: 0; font-size: 15.5px; color: var(--ink); font-weight: 600; }
    h3 a { color: inherit; text-decoration: none; }
    h3 a:hover { color: var(--accent); }
    .desc { color: var(--ink-soft); font-size: 13.5px; margin: 8px 0; line-height: 1.5; }
    .meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--ink-faint); flex-wrap: wrap; }
    .dup { color: var(--warning); font-size: 12px; margin: 10px 0 0; font-weight: 600; }
    .actions { display: flex; gap: 10px; margin-top: 14px; align-items: center; }
    .actions select { width: auto; min-width: 130px; }
    .empty { color: var(--ink-faint); text-align: center; padding: 40px; font-size: 14px; }
    @media (max-width: 720px) { .filters { grid-template-columns: 1fr; } }
  `],
})
export class ManageIssuesComponent implements OnInit {
  resolve(url?: string): string {
    return url ? resolveImageUrl(url) : '';
  }

  issues: Issue[] = [];
  categories: Category[] = [];

  search = '';
  statusFilter = '';
  urgencyFilter = '';
  categoryFilter = '';
  private searchDebounce: any;

  selectedIds = new Set<string>();
  bulkStatus = '';
  bulkUrgency = '';
  bulkLoading = false;

  constructor(private issuesService: IssuesService, public translation: TranslationService) {}

  ngOnInit(): void {
    this.issuesService.getCategories().subscribe((cats) => (this.categories = cats));
    this.loadIssues();
  }

  applyFilters(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.loadIssues(), 300);
  }

  loadIssues(): void {
    this.issuesService
      .getIssues({
        search: this.search || undefined,
        status: this.statusFilter || undefined,
        urgency: this.urgencyFilter || undefined,
        categoryId: this.categoryFilter || undefined,
      })
      .subscribe((issues) => {
        this.issues = issues;
        this.selectedIds.clear();
      });
  }

  ticketId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  isOverdue(issue: Issue): boolean {
    if (issue.urgency !== 'high') return false;
    if (issue.status === 'resolved' || issue.status === 'rejected') return false;
    const ageHours = (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60);
    return ageHours > OVERDUE_HOURS;
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  allSelected(): boolean {
    return this.issues.length > 0 && this.issues.every((i) => this.selectedIds.has(i.id));
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.issues.forEach((i) => this.selectedIds.add(i.id));
    else this.selectedIds.clear();
  }

  applyBulk(): void {
    if (this.selectedIds.size === 0 || (!this.bulkStatus && !this.bulkUrgency)) return;
    this.bulkLoading = true;
    const changes: { status?: string; urgency?: string } = {};
    if (this.bulkStatus) changes.status = this.bulkStatus;
    if (this.bulkUrgency) changes.urgency = this.bulkUrgency;

    this.issuesService.bulkUpdate(Array.from(this.selectedIds), changes).subscribe({
      next: () => {
        this.bulkLoading = false;
        this.bulkStatus = '';
        this.bulkUrgency = '';
        this.loadIssues();
      },
      error: () => (this.bulkLoading = false),
    });
  }

  updateStatus(issue: Issue): void {
    this.issuesService.updateIssue(issue.id, { status: issue.status }).subscribe();
  }

  updateUrgency(issue: Issue): void {
    this.issuesService.updateIssue(issue.id, { urgency: issue.urgency }).subscribe();
  }

  remove(issue: Issue): void {
    if (!confirm(`${this.translation.t('manage.confirmDelete')} "${issue.title}"?`)) return;
    this.issuesService.deleteIssue(issue.id).subscribe(() => {
      this.issues = this.issues.filter((i) => i.id !== issue.id);
      this.selectedIds.delete(issue.id);
    });
  }
}
