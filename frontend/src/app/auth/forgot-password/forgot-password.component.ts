import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>

        <span class="eyebrow">{{ 'forgot.eyebrow' | translate }}</span>
        <h1>{{ 'forgot.title' | translate }}</h1>
        <p class="subtitle">{{ 'forgot.subtitle' | translate }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="!sent">
          <label>{{ 'login.email' | translate }}</label>
          <input type="email" formControlName="email" placeholder="emri@universiteti.edu" />

          <button class="btn btn-primary" style="width:100%; margin-top:22px" [disabled]="form.invalid || loading">
            {{ (loading ? 'forgot.sending' : 'forgot.submit') | translate }}
          </button>
        </form>

        <p class="success" *ngIf="sent">{{ 'forgot.sent' | translate }}</p>

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
    h1 { font-size: 22px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 26px; }
    .success { color: var(--success); font-size: 14px; font-weight: 600; text-align: center; padding: 10px 0; }
    .switch { text-align: center; font-size: 14px; margin-top: 20px; }
    .switch a { color: var(--accent); font-weight: 600; text-decoration: none; }
  `],
})
export class ForgotPasswordComponent {
  loading = false;
  sent = false;

  form = new FormBuilder().group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(private auth: AuthService) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const email = this.form.getRawValue().email!;
    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.sent = true;
      },
      error: () => {
        // Backend always returns a generic success message regardless of outcome (security best practice),
        // so a network-level error here is the only realistic failure case.
        this.loading = false;
        this.sent = true;
      },
    });
  }
}
