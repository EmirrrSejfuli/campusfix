import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>

        <span class="eyebrow">{{ 'reset.eyebrow' | translate }}</span>
        <h1>{{ 'reset.title' | translate }}</h1>

        <ng-container *ngIf="!token">
          <p class="error-box">{{ 'reset.invalidLink' | translate }}</p>
        </ng-container>

        <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="token && !done">
          <label>{{ 'reset.newPassword' | translate }}</label>
          <input type="password" formControlName="newPassword" [placeholder]="'register.passwordHint' | translate" />

          <p class="error" *ngIf="errorMsg">{{ errorMsg }}</p>

          <button class="btn btn-primary" style="width:100%; margin-top:22px" [disabled]="form.invalid || loading">
            {{ (loading ? 'reset.saving' : 'reset.submit') | translate }}
          </button>
        </form>

        <p class="success" *ngIf="done">{{ 'reset.done' | translate }}</p>

        <p class="switch">
          <a routerLink="/login">← {{ 'login.title' | translate }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100vh - 63px); display: flex; align-items: center; justify-content: center;
      padding: 40px 20px;
      background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px);
      background-size: 28px 28px; background-position: center;
    }
    .auth-card { position: relative; width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 34px 32px; }
    .corner { position: absolute; width: 16px; height: 16px; border-color: var(--accent); }
    .tl { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; border-top-left-radius: 6px; }
    .tr { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; border-top-right-radius: 6px; }
    .bl { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; border-bottom-left-radius: 6px; }
    .br { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; border-bottom-right-radius: 6px; }
    .eyebrow { display: inline-block; font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--accent); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 14px; }
    h1 { font-size: 22px; margin: 0 0 20px; color: var(--ink); }
    .error-box { color: var(--danger); font-size: 14px; text-align: center; padding: 10px 0; }
    .error { color: var(--danger); font-size: 13px; margin-top: 10px; }
    .success { color: var(--success); font-size: 14px; font-weight: 600; text-align: center; padding: 10px 0; }
    .switch { text-align: center; font-size: 14px; margin-top: 20px; }
    .switch a { color: var(--accent); font-weight: 600; text-decoration: none; }
  `],
})
export class ResetPasswordComponent implements OnInit {
  token: string | null = null;
  loading = false;
  done = false;
  errorMsg = '';

  form = new FormBuilder().group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private translation: TranslationService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  submit(): void {
    if (this.form.invalid || !this.token) return;
    this.loading = true;
    this.errorMsg = '';
    const newPassword = this.form.getRawValue().newPassword!;

    this.auth.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.done = true;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message ?? this.translation.t('reset.error');
      },
    });
  }
}
