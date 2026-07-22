import { Injectable, signal, effect } from '@angular/core';

const THEME_KEY = 'campusfix_theme';
export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(this.readStoredTheme());

  constructor() {
    // Reflect the current theme onto <html data-theme="..."> whenever it changes.
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
    });
  }

  toggle(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem(THEME_KEY, next);
  }

  private readStoredTheme(): Theme {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light';
  }
}
