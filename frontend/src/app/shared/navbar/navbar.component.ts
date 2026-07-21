import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppNotification } from '../../core/models';
import { Lang, LANG_NAMES } from '../../core/i18n/translations';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <nav>
      <div class="brand">
        <span class="mark">CF</span>
        <span class="wordmark">CampusFix</span>
      </div>

      <div class="links" *ngIf="auth.isAuthenticated()">
        <ng-container *ngIf="!auth.isAdmin()">
          <a routerLink="/report" routerLinkActive="active">{{ 'nav.report' | translate }}</a>
          <a routerLink="/my-issues" routerLinkActive="active">{{ 'nav.myIssues' | translate }}</a>
          <a routerLink="/browse" routerLinkActive="active">{{ 'nav.browse' | translate }}</a>
          <a routerLink="/map" routerLinkActive="active">{{ 'nav.map' | translate }}</a>
        </ng-container>
        <ng-container *ngIf="auth.isAdmin()">
          <a routerLink="/admin" routerLinkActive="active">{{ 'nav.dashboard' | translate }}</a>
          <a routerLink="/admin/issues" routerLinkActive="active">{{ 'nav.manage' | translate }}</a>
          <a routerLink="/map" routerLinkActive="active">{{ 'nav.map' | translate }}</a>
          <a routerLink="/admin/qr" routerLinkActive="active">{{ 'nav.qr' | translate }}</a>
        </ng-container>
      </div>

      <div class="right">
        <button class="theme-btn" (click)="theme.toggle()" [title]="'nav.toggleTheme' | translate">
          <span *ngIf="theme.theme() === 'light'">🌙</span>
          <span *ngIf="theme.theme() === 'dark'">☀️</span>
        </button>

        <div class="lang-wrap">
          <button class="lang-btn" (click)="langOpen = !langOpen">{{ translation.lang().toUpperCase() }}</button>
          <div class="lang-dropdown" *ngIf="langOpen">
            <button *ngFor="let l of langs" (click)="selectLang(l)" [class.active]="translation.lang() === l">
              {{ langNames[l] }}
            </button>
          </div>
        </div>

        <ng-container *ngIf="auth.isAuthenticated()">
        <div class="bell-wrap">
          <button class="bell-btn" (click)="toggleDropdown()">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span class="badge-dot" *ngIf="unreadCount > 0">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          </button>

          <div class="dropdown" *ngIf="dropdownOpen">
            <div class="dropdown-header">
              <span>{{ 'nav.notifications' | translate }}</span>
              <button *ngIf="unreadCount > 0" (click)="markAllRead()">{{ 'nav.markAllRead' | translate }}</button>
            </div>
            <div class="dropdown-list" *ngIf="notifications.length > 0; else emptyNotif">
              <div class="notif-item" *ngFor="let n of notifications" [class.unread]="!n.isRead" (click)="markOne(n)">
                <p>{{ translation.translateNotification(n) }}</p>
                <span class="time">{{ n.createdAt | date: 'dd/MM HH:mm' }}</span>
              </div>
            </div>
            <ng-template #emptyNotif>
              <p class="empty-notif">{{ 'nav.noNotifications' | translate }}</p>
            </ng-template>
          </div>
        </div>

        <a routerLink="/profile" class="profile-link">
          <span class="role-tag">{{ (auth.isAdmin() ? 'nav.admin' : 'nav.student') | translate }}</span>
          <span class="name">{{ auth.currentUser()?.fullName }}</span>
        </a>
        <button class="btn btn-outline" (click)="auth.logout()">{{ 'nav.logout' | translate }}</button>
        </ng-container>
      </div>
    </nav>
  `,
  styles: [`
    nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 28px; background: var(--surface); border-bottom: 1px solid var(--line);
      position: relative; z-index: 50;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .mark {
      width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
      background: var(--brand-ink); color: #fff; font-family: var(--font-mono); font-weight: 600;
      font-size: 12px; border-radius: 6px;
    }
    .wordmark { font-family: var(--font-display); font-weight: 700; font-size: 18px; color: var(--ink); }
    .links { display: flex; gap: 24px; }
    .links a {
      text-decoration: none; color: var(--ink-soft); font-weight: 500; font-size: 14px;
      padding: 6px 0; border-bottom: 2px solid transparent; white-space: nowrap;
    }
    .links a.active { color: var(--ink); border-bottom-color: var(--accent); }
    .right { display: flex; align-items: center; gap: 12px; }

    .lang-wrap { position: relative; }
    .theme-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--line);
      background: var(--surface); font-size: 15px;
      display: flex; align-items: center; justify-content: center;
    }
    .theme-btn:hover { background: var(--paper); }
    .lang-btn {
      width: 40px; height: 36px; border-radius: 8px; border: 1px solid var(--line);
      background: var(--surface); color: var(--ink-soft); font-family: var(--font-mono);
      font-weight: 600; font-size: 11.5px; letter-spacing: 0.03em;
    }
    .lang-btn:hover { background: var(--paper); color: var(--ink); }
    .lang-dropdown {
      position: absolute; top: 42px; right: 0; min-width: 140px;
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
      box-shadow: 0 12px 32px rgba(15,23,42,0.12); overflow: hidden;
    }
    .lang-dropdown button {
      display: block; width: 100%; text-align: left; padding: 9px 14px;
      background: none; border: none; font-size: 13.5px; color: var(--ink);
    }
    .lang-dropdown button:hover { background: var(--paper); }
    .lang-dropdown button.active { color: var(--accent); font-weight: 600; }

    .bell-wrap { position: relative; }
    .bell-btn {
      position: relative; width: 36px; height: 36px; border-radius: 8px;
      border: 1px solid var(--line); background: var(--surface); color: var(--ink-soft);
      display: flex; align-items: center; justify-content: center;
    }
    .bell-btn:hover { background: var(--paper); color: var(--ink); }
    .badge-dot {
      position: absolute; top: -6px; right: -6px; min-width: 17px; height: 17px; padding: 0 4px;
      background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; font-family: var(--font-mono);
      border-radius: 999px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--surface);
    }
    .dropdown {
      position: absolute; top: 46px; right: 0; width: 320px; background: var(--surface);
      border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: 0 12px 32px rgba(15,23,42,0.12);
      overflow: hidden;
    }
    .dropdown-header {
      display: flex; align-items: center; justify-content: space-between; padding: 12px 14px;
      border-bottom: 1px solid var(--line); font-size: 13px; font-weight: 600; color: var(--ink);
    }
    .dropdown-header button { background: none; border: none; color: var(--accent); font-size: 12px; font-weight: 600; }
    .dropdown-list { max-height: 320px; overflow-y: auto; }
    .notif-item { padding: 12px 14px; border-bottom: 1px solid var(--line); cursor: pointer; }
    .notif-item:hover { background: var(--paper); }
    .notif-item:last-child { border-bottom: none; }
    .notif-item.unread { background: var(--accent-bg); }
    .notif-item p { margin: 0 0 4px; font-size: 13px; color: var(--ink); line-height: 1.4; }
    .notif-item .time { font-size: 11px; color: var(--ink-faint); font-family: var(--font-mono); }
    .empty-notif { padding: 22px 14px; text-align: center; color: var(--ink-faint); font-size: 13px; }

    .profile-link { display: flex; align-items: center; gap: 10px; text-decoration: none; padding: 4px 8px 4px 4px; border-radius: 8px; }
    .profile-link:hover { background: var(--paper); }
    .role-tag { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; color: var(--accent); background: var(--accent-bg); padding: 3px 8px; border-radius: 5px; }
    .name { font-size: 14px; font-weight: 500; color: var(--ink); }
  `],
})
export class NavbarComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: AppNotification[] = [];
  dropdownOpen = false;
  langOpen = false;
  langs: Lang[] = ['sq', 'en', 'mk'];
  langNames = LANG_NAMES;
  private pollHandle: any;

  constructor(
    public auth: AuthService,
    private notificationsService: NotificationsService,
    public translation: TranslationService,
    public theme: ThemeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.refreshUnread();
      // Fast polling so newly-created notifications feel close to real-time without needing WebSockets.
      this.pollHandle = setInterval(() => this.refreshUnread(), 5000);
      // Also refresh immediately whenever the person navigates to a different page.
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.refreshUnread());
    }
  }

  ngOnDestroy(): void {
    if (this.pollHandle) clearInterval(this.pollHandle);
  }

  selectLang(l: Lang): void {
    this.translation.setLang(l);
    this.langOpen = false;
  }

  refreshUnread(): void {
    this.notificationsService.unreadCount().subscribe((res) => (this.unreadCount = res.count));
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.notificationsService.getAll().subscribe((list) => (this.notifications = list));
    }
  }

  markOne(n: AppNotification): void {
    if (n.isRead) return;
    n.isRead = true;
    this.notificationsService.markRead(n.id).subscribe(() => this.refreshUnread());
  }

  markAllRead(): void {
    this.notificationsService.markAllRead().subscribe(() => {
      this.notifications.forEach((n) => (n.isRead = true));
      this.refreshUnread();
    });
  }
}
