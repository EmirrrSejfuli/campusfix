import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { UserRole } from '../../core/models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>

        <span class="eyebrow">{{ 'login.eyebrow' | translate }}</span>
        <h1>{{ 'login.title' | translate }}</h1>
        <p class="subtitle">{{ 'login.subtitle' | translate }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>{{ 'login.email' | translate }}</label>
          <input type="email" formControlName="email" placeholder="emri@universiteti.edu" />

          <label style="margin-top:16px">{{ 'login.password' | translate }}</label>
          <input type="password" formControlName="password" placeholder="••••••••" />
          <a routerLink="/forgot-password" class="forgot-link">{{ 'login.forgotPassword' | translate }}</a>

          <p class="error" *ngIf="errorMsg">{{ errorMsg }}</p>

          <button class="btn btn-primary" style="width:100%; margin-top:22px" [disabled]="form.invalid || loading">
            {{ (loading ? 'login.submitting' : 'login.submit') | translate }}
          </button>
        </form>

        <p class="switch">
          {{ 'login.noAccount' | translate }} <a routerLink="/register">{{ 'login.registerHere' | translate }}</a>
        </p>
        <p class="switch">
          <a routerLink="/stats">{{ 'nav.publicStats' | translate }}</a>
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
    h1 { font-size: 23px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 26px; }
    .error { color: var(--danger); font-size: 13px; margin-top: 10px; }
    .forgot-link { display: block; text-align: right; font-size: 12.5px; color: var(--ink-soft); text-decoration: none; margin-top: 8px; }
    .forgot-link:hover { color: var(--accent); }
    .switch { text-align: center; font-size: 14px; margin-top: 20px; color: var(--ink-soft); }
    .switch a { color: var(--accent); font-weight: 600; text-decoration: none; }
  `],
})
export class LoginComponent {
  loading = false;
  errorMsg = '';

  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor(private auth: AuthService, private router: Router, public translation: TranslationService) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { email, password } = this.form.getRawValue();

    this.auth.login(email!, password!).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate([res.user.role === UserRole.ADMIN ? '/admin' : '/report']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message ?? this.translation.t('login.genericError');
      },
    });
  }
}
