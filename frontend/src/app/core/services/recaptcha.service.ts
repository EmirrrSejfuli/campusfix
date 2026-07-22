import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const grecaptcha: any;

/**
 * Loads Google reCAPTCHA v3 on demand and executes it to get a verification
 * token. If no site key is configured (environment.recaptchaSiteKey is
 * empty), this resolves to undefined immediately — the backend then skips
 * verification too, so registration keeps working exactly as before until
 * a reCAPTCHA site is set up.
 */
@Injectable({ providedIn: 'root' })
export class RecaptchaService {
  private scriptLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  private loadScript(): Promise<void> {
    if (this.scriptLoaded) return Promise.resolve();
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${environment.recaptchaSiteKey}`;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
      document.head.appendChild(script);
    });
    return this.loadingPromise;
  }

  async getToken(action: string): Promise<string | undefined> {
    if (!environment.recaptchaSiteKey) return undefined;

    try {
      await this.loadScript();
      return await new Promise<string>((resolve) => {
        grecaptcha.ready(() => {
          grecaptcha.execute(environment.recaptchaSiteKey, { action }).then(resolve);
        });
      });
    } catch {
      return undefined; // fail open — don't block registration if reCAPTCHA itself fails to load
    }
  }
}
