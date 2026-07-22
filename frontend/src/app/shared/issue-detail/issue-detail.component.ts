import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IssuesService } from '../../core/services/issues.service';
import { resolveImageUrl } from '../../core/services/api.config';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { WatchesService, Watch } from '../../core/services/watches.service';
import { CommentsService } from '../../core/services/comments.service';
import { Issue, IssueComment } from '../../core/models';
import { LightboxComponent } from '../lightbox/lightbox.component';
import { TranslatePipe } from '../pipes/translate.pipe';

const OVERDUE_HOURS = 24; // high-urgency reports still open after this many hours are flagged as overdue

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LightboxComponent, TranslatePipe],
  template: `
    <a routerLink="/my-issues" class="back-link" *ngIf="!auth.isAdmin()">← {{ 'detail.backMy' | translate }}</a>
    <a routerLink="/admin/issues" class="back-link" *ngIf="auth.isAdmin()">← {{ 'detail.backAdmin' | translate }}</a>

    <div class="card detail" *ngIf="issue">
      <div class="top-row">
        <span class="ticket-id">#{{ issue.id.slice(0,8).toUpperCase() }}</span>
        <div class="badges">
          <span class="badge badge-rejected" *ngIf="isOverdue()">⚠ {{ 'sla.overdue' | translate }}</span>
          <span class="badge" [ngClass]="'badge-' + issue.status">{{ ('status.' + issue.status) | translate }}</span>
          <span class="badge badge-{{issue.urgency}}">{{ ('urgency.' + issue.urgency) | translate }}</span>
        </div>
      </div>

      <ng-container *ngIf="!editing">
        <h1>{{ issue.title }}</h1>
        <p class="desc">{{ issue.description }}</p>
      </ng-container>

      <div class="edit-form" *ngIf="editing">
        <label>{{ 'report.titleLabel' | translate }}</label>
        <input [(ngModel)]="editTitle" />
        <label style="margin-top:12px">{{ 'report.descriptionLabel' | translate }}</label>
        <textarea [(ngModel)]="editDescription" rows="4"></textarea>
        <label style="margin-top:12px">{{ 'report.locationLabel' | translate }}</label>
        <input [(ngModel)]="editLocation" />
        <div class="edit-actions">
          <button class="btn btn-primary" (click)="saveEdit()">{{ 'detail.save' | translate }}</button>
          <button class="btn btn-outline" (click)="editing = false">{{ 'detail.cancelEdit' | translate }}</button>
        </div>
      </div>

      <div class="photo-grid" *ngIf="photos.length > 0 && !editing">
        <img *ngFor="let url of photos; let i = index" [src]="resolve(url)" alt="" (click)="openLightbox(i)" />
      </div>

      <div class="meta-grid" *ngIf="!editing">
        <div class="meta-item">
          <span class="meta-label">{{ 'detail.category' | translate }}</span>
          <span class="meta-value">{{ translation.categoryName(issue.category?.name) }}</span>
        </div>
        <div class="meta-item" *ngIf="issue.location">
          <span class="meta-label">{{ 'detail.location' | translate }}</span>
          <span class="meta-value">
            {{ issue.location }}
            <button class="watch-btn" *ngIf="!auth.isAdmin() && !isOwner()" (click)="toggleWatch()" [disabled]="watchLoading">
              {{ (isWatching ? 'detail.unwatch' : 'detail.watch') | translate }}
            </button>
          </span>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ 'detail.reportedBy' | translate }}</span>
          <span class="meta-value">{{ issue.reportedBy?.fullName }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ 'detail.date' | translate }}</span>
          <span class="meta-value">{{ issue.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>

      <p class="dup" *ngIf="issue.isPossibleDuplicate">⚠ {{ 'detail.duplicateWarning' | translate }}</p>

      <div class="confirm-row" *ngIf="!auth.isAdmin() && !isOwner() && !editing">
        <button class="btn" [class.btn-primary]="confirmed" [class.btn-outline]="!confirmed" (click)="toggleConfirm()" [disabled]="confirmLoading">
          👍 {{ (confirmed ? 'detail.confirmedByMe' : 'detail.confirmToo') | translate }}
        </button>
        <span class="confirm-count" *ngIf="confirmCount > 0">{{ confirmCount }} {{ 'detail.othersConfirmed' | translate }}</span>
      </div>

      <div class="rating-box" *ngIf="isOwner() && issue.status === 'resolved' && !editing">
        <ng-container *ngIf="!issue.satisfactionRating">
          <p class="rating-prompt">{{ 'detail.ratePrompt' | translate }}</p>
          <div class="stars">
            <span *ngFor="let s of [1,2,3,4,5]" class="star"
              (click)="submitRating(s)"
              (mouseenter)="hoverStar = s"
              (mouseleave)="hoverStar = 0">
              {{ s <= hoverStar ? '★' : '☆' }}
            </span>
          </div>
        </ng-container>
        <p class="rating-done" *ngIf="issue.satisfactionRating">
          {{ 'detail.yourRating' | translate }}: {{ '★'.repeat(issue.satisfactionRating) }}{{ '☆'.repeat(5 - issue.satisfactionRating) }}
        </p>
      </div>

      <div class="owner-actions" *ngIf="isOwner() && issue.status === 'pending' && !editing">
        <button class="btn btn-outline" (click)="startEdit()">{{ 'detail.edit' | translate }}</button>
        <button class="btn btn-danger" (click)="cancelIssue()">{{ 'detail.cancel' | translate }}</button>
      </div>
    </div>

    <div class="card comments-card" *ngIf="issue">
      <h3>{{ 'comments.title' | translate }} ({{ comments.length }})</h3>

      <div class="comment-list" *ngIf="comments.length > 0; else noComments">
        <div class="comment-item" *ngFor="let c of comments">
          <div class="comment-avatar">{{ initials(c.author?.fullName) }}</div>
          <div class="comment-body">
            <div class="comment-head">
              <span class="comment-author">{{ c.author?.fullName }}</span>
              <span class="comment-time">{{ c.createdAt | date: 'dd/MM HH:mm' }}</span>
            </div>
            <p>{{ c.text }}</p>
          </div>
        </div>
      </div>
      <ng-template #noComments>
        <p class="empty-comments">{{ 'comments.empty' | translate }}</p>
      </ng-template>

      <div class="comment-form">
        <input [(ngModel)]="newComment" [placeholder]="'comments.placeholder' | translate" (keyup.enter)="sendComment()" />
        <button class="btn btn-primary" (click)="sendComment()" [disabled]="!newComment.trim() || sendingComment">
          {{ 'comments.send' | translate }}
        </button>
      </div>
    </div>

    <app-lightbox
      [open]="lightboxOpen"
      [src]="lightboxSrc"
      [alt]="issue?.title || ''"
      [onClose]="closeLightbox"
    ></app-lightbox>
  `,
  styles: [`
    .back-link { display: inline-block; margin-bottom: 16px; color: var(--ink-soft); text-decoration: none; font-size: 13.5px; }
    .back-link:hover { color: var(--accent); }
    .detail { max-width: 640px; margin: 0 auto; }
    .top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .badges { display: flex; gap: 8px; }
    h1 { font-size: 21px; margin: 0 0 12px; color: var(--ink); }
    .desc { color: var(--ink-soft); font-size: 14.5px; line-height: 1.6; margin: 0 0 18px; }
    .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-bottom: 18px; }
    .photo-grid img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; cursor: zoom-in; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding-top: 14px; border-top: 1px solid var(--line); }
    .meta-item { display: flex; flex-direction: column; gap: 3px; }
    .meta-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: var(--ink-faint); }
    .meta-value { font-size: 13.5px; color: var(--ink); }
    .watch-btn {
      margin-left: 8px; font-size: 11px; font-weight: 600; color: var(--accent);
      background: var(--accent-bg); border: none; border-radius: 5px; padding: 3px 8px;
    }
    .watch-btn:hover { background: #FFE3D3; }
    .dup { color: var(--warning); font-size: 13px; margin: 16px 0 0; font-weight: 600; }
    .confirm-row { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--line); }
    .confirm-count { font-size: 12.5px; color: var(--ink-soft); }
    .rating-box { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--line); }
    .rating-prompt { font-size: 13.5px; color: var(--ink-soft); margin: 0 0 8px; }
    .stars { display: flex; gap: 6px; }
    .star { font-size: 28px; color: var(--warning); cursor: pointer; line-height: 1; user-select: none; }
    .rating-done { font-size: 16px; color: var(--warning); margin: 0; }
    .owner-actions { display: flex; gap: 10px; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--line); }
    .edit-form { margin-bottom: 18px; }
    .edit-actions { display: flex; gap: 10px; margin-top: 16px; }

    .comments-card { max-width: 640px; margin: 14px auto 0; }
    .comments-card h3 { margin: 0 0 16px; font-size: 15px; color: var(--ink); font-weight: 600; }
    .comment-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
    .comment-item { display: flex; gap: 10px; }
    .comment-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: var(--brand-ink); color: #fff;
      display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;
      font-family: var(--font-display); flex-shrink: 0;
    }
    .comment-body { flex: 1; min-width: 0; }
    .comment-head { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
    .comment-author { font-size: 13px; font-weight: 600; color: var(--ink); }
    .comment-time { font-size: 11px; color: var(--ink-faint); font-family: var(--font-mono); }
    .comment-body p { margin: 0; font-size: 13.5px; color: var(--ink-soft); line-height: 1.5; }
    .empty-comments { color: var(--ink-faint); font-size: 13px; text-align: center; padding: 16px 0; }
    .comment-form { display: flex; gap: 10px; padding-top: 14px; border-top: 1px solid var(--line); }
  `],
})
export class IssueDetailComponent implements OnInit {
  resolve(url?: string): string {
    return url ? resolveImageUrl(url) : '';
  }

  issue: Issue | null = null;
  lightboxOpen = false;
  lightboxSrc = '';
  photos: string[] = [];
  editing = false;
  editTitle = '';
  editDescription = '';
  editLocation = '';
  isWatching = false;
  watchLoading = false;
  comments: IssueComment[] = [];
  newComment = '';
  sendingComment = false;
  confirmed = false;
  confirmCount = 0;
  confirmLoading = false;
  hoverStar = 0;
  private myWatchId: string | null = null;

  closeLightbox = () => (this.lightboxOpen = false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private issuesService: IssuesService,
    public auth: AuthService,
    public translation: TranslationService,
    private watchesService: WatchesService,
    private commentsService: CommentsService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.issuesService.getIssue(id).subscribe((issue) => {
      this.issue = issue;
      this.photos = this.parsePhotos(issue);
      if (issue.location && !this.auth.isAdmin()) this.checkWatchState(issue.location);
    });
    this.loadComments(id);
    this.issuesService.getConfirmationState(id).subscribe((res) => {
      this.confirmed = res.confirmed;
      this.confirmCount = res.count;
    });
  }

  toggleConfirm(): void {
    if (!this.issue) return;
    this.confirmLoading = true;
    this.issuesService.toggleConfirmation(this.issue.id).subscribe({
      next: (res) => {
        this.confirmed = res.confirmed;
        this.confirmCount = res.count;
        this.confirmLoading = false;
      },
      error: () => (this.confirmLoading = false),
    });
  }

  submitRating(stars: number): void {
    if (!this.issue) return;
    this.issuesService.rateIssue(this.issue.id, stars).subscribe((updated) => {
      this.issue = updated;
    });
  }

  private parsePhotos(issue: Issue): string[] {
    if (issue.imageUrlsJson) {
      try {
        const arr = JSON.parse(issue.imageUrlsJson);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      } catch {
        // fall through to legacy field
      }
    }
    return issue.imageUrl ? [issue.imageUrl] : [];
  }

  openLightbox(index: number): void {
    this.lightboxSrc = this.resolve(this.photos[index]);
    this.lightboxOpen = true;
  }

  isOverdue(): boolean {
    if (!this.issue) return false;
    if (this.issue.urgency !== 'high') return false;
    if (this.issue.status === 'resolved' || this.issue.status === 'rejected') return false;
    const ageHours = (Date.now() - new Date(this.issue.createdAt).getTime()) / (1000 * 60 * 60);
    return ageHours > OVERDUE_HOURS;
  }

  loadComments(issueId: string): void {
    this.commentsService.getForIssue(issueId).subscribe((c) => (this.comments = c));
  }

  sendComment(): void {
    if (!this.issue || !this.newComment.trim()) return;
    this.sendingComment = true;
    this.commentsService.create(this.issue.id, this.newComment.trim()).subscribe({
      next: (c) => {
        this.comments.push(c);
        this.newComment = '';
        this.sendingComment = false;
      },
      error: () => (this.sendingComment = false),
    });
  }

  initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  private checkWatchState(location: string): void {
    this.watchesService.getMine().subscribe((watches) => {
      const match = watches.find((w) => w.location.toLowerCase() === location.toLowerCase());
      this.isWatching = !!match;
      this.myWatchId = match?.id ?? null;
    });
  }

  toggleWatch(): void {
    if (!this.issue?.location) return;
    this.watchLoading = true;
    if (this.isWatching && this.myWatchId) {
      this.watchesService.remove(this.myWatchId).subscribe(() => {
        this.isWatching = false;
        this.myWatchId = null;
        this.watchLoading = false;
      });
    } else {
      this.watchesService.create(this.issue.location).subscribe({
        next: (w: Watch) => {
          this.isWatching = true;
          this.myWatchId = w.id;
          this.watchLoading = false;
        },
        error: () => (this.watchLoading = false),
      });
    }
  }

  isOwner(): boolean {
    return !!this.issue && this.issue.reportedBy?.id === this.auth.currentUser()?.id;
  }

  startEdit(): void {
    if (!this.issue) return;
    this.editTitle = this.issue.title;
    this.editDescription = this.issue.description;
    this.editLocation = this.issue.location ?? '';
    this.editing = true;
  }

  saveEdit(): void {
    if (!this.issue) return;
    this.issuesService
      .updateOwnIssue(this.issue.id, { title: this.editTitle, description: this.editDescription, location: this.editLocation })
      .subscribe((updated) => {
        this.issue = updated;
        this.photos = this.parsePhotos(updated);
        this.editing = false;
      });
  }

  cancelIssue(): void {
    if (!this.issue) return;
    if (!confirm(this.translation.t('detail.confirmCancel'))) return;
    this.issuesService.cancelOwnIssue(this.issue.id).subscribe(() => this.router.navigate(['/my-issues']));
  }
}
