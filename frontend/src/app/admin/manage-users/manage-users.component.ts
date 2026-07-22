import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { User } from '../../core/models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <span class="eyebrow">{{ 'manageUsers.eyebrow' | translate }}</span>
    <h1>{{ 'manageUsers.title' | translate }}</h1>
    <p class="subtitle">{{ 'manageUsers.subtitle' | translate }}</p>

    <div class="list">
      <div class="card user-row" *ngFor="let u of users">
        <div class="avatar">{{ initials(u.fullName) }}</div>
        <div class="info">
          <div class="name-row">
            <span class="name">{{ u.fullName }}</span>
            <span class="badge" [ngClass]="u.role === 'admin' ? 'badge-resolved' : 'badge-pending'">
              {{ (u.role === 'admin' ? 'nav.admin' : 'nav.student') | translate }}
            </span>
            <span class="you-tag" *ngIf="u.id === auth.currentUser()?.id">({{ 'manageUsers.you' | translate }})</span>
          </div>
          <span class="email">{{ u.email }}</span>
        </div>
        <button
          class="btn"
          [class.btn-danger]="u.role === 'admin'"
          [class.btn-primary]="u.role !== 'admin'"
          (click)="toggleRole(u)"
          [disabled]="loadingId === u.id"
        >
          {{ (u.role === 'admin' ? 'manageUsers.makeStudent' : 'manageUsers.makeAdmin') | translate }}
        </button>
      </div>

      <div class="empty" *ngIf="users.length === 0">{{ 'manageUsers.empty' | translate }}</div>
    </div>
  `,
  styles: [`
    .eyebrow { display: inline-block; font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--accent); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
    h1 { font-size: 22px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 22px; }
    .list { display: flex; flex-direction: column; gap: 10px; }
    .user-row { display: flex; align-items: center; gap: 14px; }
    .avatar {
      width: 40px; height: 40px; border-radius: 10px; background: var(--brand-ink); color: #fff;
      display: flex; align-items: center; justify-content: center; font-family: var(--font-display);
      font-weight: 700; font-size: 13px; flex-shrink: 0;
    }
    .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .name { font-size: 14.5px; font-weight: 600; color: var(--ink); }
    .you-tag { font-size: 12px; color: var(--ink-faint); }
    .email { font-size: 13px; color: var(--ink-soft); }
    .empty { color: var(--ink-faint); text-align: center; padding: 40px; font-size: 14px; }
  `],
})
export class ManageUsersComponent implements OnInit {
  users: User[] = [];
  loadingId: string | null = null;

  constructor(
    private usersService: UsersService,
    public auth: AuthService,
    private translation: TranslationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersService.getAll().subscribe((u) => (this.users = u));
  }

  toggleRole(u: User): void {
    const newRole = u.role === 'admin' ? 'student' : 'admin';
    const confirmMsg =
      newRole === 'admin'
        ? this.translation.t('manageUsers.confirmMakeAdmin').replace('{name}', u.fullName)
        : this.translation.t('manageUsers.confirmMakeStudent').replace('{name}', u.fullName);

    if (!confirm(confirmMsg)) return;

    this.loadingId = u.id;
    this.usersService.updateRole(u.id, newRole).subscribe({
      next: (updated) => {
        u.role = updated.role;
        this.loadingId = null;
      },
      error: (err) => {
        alert(err.error?.message ?? this.translation.t('manageUsers.error'));
        this.loadingId = null;
      },
    });
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
