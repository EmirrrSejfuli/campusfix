import { Injectable, signal } from '@angular/core';
import { Lang, TRANSLATIONS } from '../i18n/translations';
import { AppNotification } from '../models';

const LANG_KEY = 'campusfix_lang';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  lang = signal<Lang>(this.readStoredLang());

  setLang(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem(LANG_KEY, lang);
  }

  t(key: string, params?: Record<string, string>): string {
    let text = TRANSLATIONS[this.lang()][key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v);
      }
    }
    return text;
  }

  /** Translates a stored notification (messageKey + raw params) into the current language. */
  translateNotification(n: AppNotification): string {
    const params = n.params ?? {};
    if (params['status']) {
      // The stored 'status' param is a raw status code (e.g. 'in_progress') — translate it too.
      return this.t(n.messageKey, { ...params, status: this.t('status.' + params['status']) });
    }
    return this.t(n.messageKey, params);
  }

  /** Translates a category's canonical (Albanian) name for display in the current language. */
  categoryName(name: string | undefined): string {
    if (!name) return '';
    return this.t('category.' + name);
  }

  private readStoredLang(): Lang {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored === 'sq' || stored === 'en' || stored === 'mk') return stored;
    return 'sq';
  }
}
