import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { WatchesService, Watch } from '../../core/services/watches.service';
import { AdminZonesService, AdminZone } from '../../core/services/admin-zones.service';
import { UserStats } from '../../core/models';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="profile-header card">
      <div class="avatar">{{ initials() }}</div>
      <div class="info">
        <h1>{{ auth.currentUser()?.fullName }}</h1>
        <p class="email">{{ auth.currentUser()?.email }}</p>
        <span class="role-tag">{{ (auth.isAdmin() ? 'nav.admin' : 'nav.student') | translate }}</span>
      </div>
    </div>

    <div class="stats-grid" *ngIf="!auth.isAdmin() && stats">
      <div class="card stat">
        <span class="value">{{ stats.total }}</span>
        <span class="label">{{ 'profile.totalReports' | translate }}</span>
      </div>
      <div class="card stat">
        <span class="value" style="color: var(--success)">{{ stats.resolved }}</span>
        <span class="label">{{ 'profile.resolved' | translate }}</span>
      </div>
      <div class="card stat">
        <span class="value" style="color: var(--info)">{{ stats.inProgress }}</span>
        <span class="label">{{ 'profile.inProgress' | translate }}</span>
      </div>
      <div class="card stat">
        <span class="value" style="color: var(--warning)">{{ stats.pending }}</span>
        <span class="label">{{ 'profile.pending' | translate }}</span>
      </div>
    </div>

    <div class="card watches-card" *ngIf="!auth.isAdmin()">
      <h3>{{ 'profile.watchedLocations' | translate }}</h3>
      <p class="watches-subtitle">{{ 'profile.watchedLocationsHint' | translate }}</p>

      <div class="add-watch">
        <input [(ngModel)]="newLocation" [placeholder]="'profile.addLocationPlaceholder' | translate" (keyup.enter)="addWatch()" />
        <button class="btn btn-primary" (click)="addWatch()" [disabled]="!newLocation.trim() || addingWatch">
          {{ 'profile.addLocation' | translate }}
        </button>
      </div>

      <div class="watch-list" *ngIf="watches.length > 0; else noWatches">
        <div class="watch-item" *ngFor="let w of watches">
          <span>{{ w.location }}</span>
          <button (click)="removeWatch(w)">✕</button>
        </div>
      </div>
      <ng-template #noWatches>
        <p class="empty">{{ 'profile.noWatches' | translate }}</p>
      </ng-template>
    </div>

    <div class="card watches-card" *ngIf="auth.isAdmin()">
      <h3>{{ 'profile.adminZones' | translate }}</h3>
      <p class="watches-subtitle">{{ 'profile.adminZonesHint' | translate }}</p>

      <div class="add-watch">
        <input [(ngModel)]="newZone" [placeholder]="'profile.addZonePlaceholder' | translate" (keyup.enter)="addZone()" />
        <button class="btn btn-primary" (click)="addZone()" [disabled]="!newZone.trim() || addingZone">
          {{ 'profile.addLocation' | translate }}
        </button>
      </div>

      <div class="watch-list" *ngIf="zones.length > 0; else noZones">
        <div class="watch-item" *ngFor="let z of zones">
          <span>{{ z.zone }}</span>
          <button (click)="removeZone(z)">✕</button>
        </div>
      </div>
      <ng-template #noZones>
        <p class="empty">{{ 'profile.noZones' | translate }}</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
    .avatar { width: 64px; height: 64px; border-radius: 14px; background: var(--brand-ink); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; font-size: 22px; flex-shrink: 0; }
    h1 { margin: 0 0 4px; font-size: 20px; color: var(--ink); }
    .email { margin: 0 0 8px; color: var(--ink-soft); font-size: 14px; }
    .role-tag { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; color: var(--accent); background: var(--accent-bg); padding: 3px 8px; border-radius: 5px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
    .stat { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 22px 16px; }
    .stat .value { font-family: var(--font-display); font-size: 30px; font-weight: 700; color: var(--ink); }
    .stat .label { font-size: 12.5px; color: var(--ink-soft); font-weight: 600; text-align: center; }
    @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr 1fr; } }

    .watches-card h3 { margin: 0 0 4px; font-size: 15px; color: var(--ink); font-weight: 600; }
    .watches-subtitle { margin: 0 0 16px; font-size: 13px; color: var(--ink-soft); }
    .add-watch { display: flex; gap: 10px; margin-bottom: 16px; }
    .watch-list { display: flex; flex-direction: column; gap: 8px; }
    .watch-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 12px; background: var(--paper); border-radius: 8px; font-size: 13.5px; color: var(--ink);
    }
    .watch-item button { background: none; border: none; color: var(--ink-faint); font-size: 13px; }
    .watch-item button:hover { color: var(--danger); }
    .empty { color: var(--ink-faint); font-size: 13px; text-align: center; padding: 12px; }
  `],
})
export class ProfileComponent implements OnInit {
  stats: UserStats | null = null;
  watches: Watch[] = [];
  newLocation = '';
  addingWatch = false;

  zones: AdminZone[] = [];
  newZone = '';
  addingZone = false;

  constructor(
    public auth: AuthService,
    private usersService: UsersService,
    private watchesService: WatchesService,
    private adminZonesService: AdminZonesService,
  ) {}

  ngOnInit(): void {
    if (!this.auth.isAdmin()) {
      this.usersService.getMyStats().subscribe((s) => (this.stats = s));
      this.loadWatches();
    } else {
      this.loadZones();
    }
  }

  loadWatches(): void {
    this.watchesService.getMine().subscribe((w) => (this.watches = w));
  }

  addWatch(): void {
    const location = this.newLocation.trim();
    if (!location) return;
    this.addingWatch = true;
    this.watchesService.create(location).subscribe({
      next: () => {
        this.newLocation = '';
        this.addingWatch = false;
        this.loadWatches();
      },
      error: () => (this.addingWatch = false),
    });
  }

  removeWatch(w: Watch): void {
    this.watchesService.remove(w.id).subscribe(() => {
      this.watches = this.watches.filter((x) => x.id !== w.id);
    });
  }

  loadZones(): void {
    this.adminZonesService.getMine().subscribe((z) => (this.zones = z));
  }

  addZone(): void {
    const zone = this.newZone.trim();
    if (!zone) return;
    this.addingZone = true;
    this.adminZonesService.create(zone).subscribe({
      next: () => {
        this.newZone = '';
        this.addingZone = false;
        this.loadZones();
      },
      error: () => (this.addingZone = false),
    });
  }

  removeZone(z: AdminZone): void {
    this.adminZonesService.remove(z.id).subscribe(() => {
      this.zones = this.zones.filter((x) => x.id !== z.id);
    });
  }

  initials(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
