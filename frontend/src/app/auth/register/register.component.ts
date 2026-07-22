import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>

        <span class="eyebrow">{{ 'register.eyebrow' | translate }}</span>
        <h1>{{ 'register.title' | translate }}</h1>
        <p class="subtitle">{{ 'register.subtitle' | translate }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>{{ 'register.fullName' | translate }}</label>
          <input formControlName="fullName" placeholder="Emri Mbiemri" />

          <label style="margin-top:16px">{{ 'register.email' | translate }}</label>
          <input type="email" formControlName="email" placeholder="emri@universiteti.edu" />

          <label style="margin-top:16px">{{ 'register.studentIndex' | translate }}</label>
          <input formControlName="studentIndex" placeholder="p.sh. 12345" />

          <label style="margin-top:16px">{{ 'register.password' | translate }}</label>
          <input type="password" formControlName="password" [placeholder]="'register.passwordHint' | translate" />

          <p class="error" *ngIf="errorMsg">{{ errorMsg }}</p>

          <button class="btn btn-primary" style="width:100%; margin-top:22px" [disabled]="form.invalid || loading">
            {{ (loading ? 'register.submitting' : 'register.submit') | translate }}
          </button>
        </form>

        <p class="switch">
          {{ 'register.hasAccount' | translate }} <a routerLink="/login">{{ 'register.loginHere' | translate }}</a>
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
    .auth-card { position: relative; width: 100%; max-width: 420px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 34px 32px; }
    .corner { position: absolute; width: 16px; height: 16px; border-color: var(--accent); }
    .tl { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; border-top-left-radius: 6px; }
    .tr { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; border-top-right-radius: 6px; }
    .bl { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; border-bottom-left-radius: 6px; }
    .br { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; border-bottom-right-radius: 6px; }
    .eyebrow { display: inline-block; font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--accent); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 14px; }
    h1 { font-size: 23px; margin: 0 0 6px; color: var(--ink); }
    .subtitle { color: var(--ink-soft); font-size: 14px; margin: 0 0 26px; }
    .error { color: var(--danger); font-size: 13px; margin-top: 10px; }
    .switch { text-align: center; font-size: 14px; margin-top: 20px; color: var(--ink-soft); }
    .switch a { color: var(--accent); font-weight: 600; text-decoration: none; }
  `],
})
export class RegisterComponent implements OnInit {
  loading = false;
  errorMsg = '';

  private fb = inject(FormBuilder);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    studentIndex: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    public translation: TranslationService,
    private recaptcha: RecaptchaService,
  ) {}

  ngOnInit(): void {
    // Load the reCAPTCHA badge as soon as this page mounts, not just at submit time.
    this.recaptcha.preload();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { fullName, email, password, studentIndex } = this.form.getRawValue();
    const captchaToken = await this.recaptcha.getToken('register');

    this.auth.register(fullName!, email!, password!, studentIndex || undefined, captchaToken).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/report']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message ?? this.translation.t('login.genericError');
      },
    });
  }
}
