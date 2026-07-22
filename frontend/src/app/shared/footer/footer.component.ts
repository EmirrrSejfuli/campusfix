import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <footer>
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="mark">CF</span>
          <div>
            <span class="wordmark">CampusFix</span>
            <span class="tagline">{{ 'footer.tagline' | translate }}</span>
          </div>
        </div>

        <nav class="footer-links">
          <a routerLink="/stats">{{ 'nav.publicStats' | translate }}</a>
          <a routerLink="/login">{{ 'login.title' | translate }}</a>
          <a routerLink="/register">{{ 'register.title' | translate }}</a>
        </nav>
      </div>

      <div class="footer-bottom">
        <p class="copyright">© {{ year }} CampusFix — {{ 'footer.rights' | translate }}</p>
        <!-- Required by Google when the floating reCAPTCHA badge is hidden via CSS (see styles.css). -->
        <p class="recaptcha-notice">
          {{ 'footer.recaptchaNotice' | translate }}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">{{ 'footer.privacyPolicy' | translate }}</a>
          {{ 'footer.and' | translate }}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener">{{ 'footer.termsOfService' | translate }}</a>
          {{ 'footer.apply' | translate }}
        </p>
      </div>
    </footer>
  `,
  styles: [`
    footer {
      margin-top: auto;
      border-top: 1px solid var(--line);
      background: var(--surface);
      padding: 28px 28px 20px;
    }
    .footer-inner {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
      max-width: 1100px;
      margin: 0 auto;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--line);
    }
    .footer-brand { display: flex; align-items: center; gap: 10px; }
    .mark {
      width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
      background: var(--brand-ink); color: #fff; font-family: var(--font-mono); font-weight: 600;
      font-size: 12px; border-radius: 6px; flex-shrink: 0;
    }
    .footer-brand div { display: flex; flex-direction: column; }
    .wordmark { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--ink); }
    .tagline { font-size: 12px; color: var(--ink-soft); }
    .footer-links { display: flex; gap: 22px; flex-wrap: wrap; }
    .footer-links a { font-size: 13.5px; color: var(--ink-soft); text-decoration: none; }
    .footer-links a:hover { color: var(--accent); }
    .footer-bottom {
      max-width: 1100px; margin: 0 auto; padding-top: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .copyright { margin: 0; font-size: 12.5px; color: var(--ink-faint); }
    .recaptcha-notice { margin: 0; font-size: 11.5px; color: var(--ink-faint); line-height: 1.6; }
    .recaptcha-notice a { color: var(--ink-soft); text-decoration: underline; }
    .recaptcha-notice a:hover { color: var(--accent); }
  `],
})
export class FooterComponent {
  year = new Date().getFullYear();
}
