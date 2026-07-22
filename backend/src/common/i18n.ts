export type Lang = 'sq' | 'en' | 'mk';

/**
 * Backend-originated user-facing messages (exceptions), translated by language.
 * The frontend sends the active language via the 'x-lang' request header.
 * Field-level validation messages (class-validator) are intentionally left
 * in English, since the Angular forms already validate client-side first.
 */
const MESSAGES: Record<Lang, Record<string, string>> = {
  sq: {
    userExists: 'Një përdorues me këtë email ekziston tashmë.',
    userNotFound: 'Përdoruesi nuk u gjet.',
    invalidCredentials: 'Email ose fjalëkalim i pasaktë.',
    accountLocked: 'Llogaria u bllokua përkohësisht për shkak të tentativave të shumta të dështuara. Provoni sërish pas {minutes} minutash.',
    issueNotFound: 'Raportimi nuk u gjet.',
    imageOnly: 'Vetëm imazhe (jpg, jpeg, png, webp) lejohen.',
    forbiddenRole: 'Nuk keni akses për këtë veprim.',
    editOwnOnly: 'Mund të editoni vetëm raportimet tuaja.',
    editPendingOnly: "Raportimi s'mund të editohet pasi ka filluar të përpunohet.",
    cancelOwnOnly: 'Mund të anuloni vetëm raportimet tuaja.',
    cancelPendingOnly: "Raportimi s'mund të anulohet pasi ka filluar të përpunohet.",
    watchLocationExists: 'Tashmë e ndiqni këtë lokacion.',
  },
  en: {
    userExists: 'A user with this email already exists.',
    userNotFound: 'User not found.',
    invalidCredentials: 'Incorrect email or password.',
    accountLocked: 'Account temporarily locked due to too many failed attempts. Try again in {minutes} minutes.',
    issueNotFound: 'Report not found.',
    imageOnly: 'Only images (jpg, jpeg, png, webp) are allowed.',
    forbiddenRole: "You don't have access to this action.",
    editOwnOnly: 'You can only edit your own reports.',
    editPendingOnly: 'This report can no longer be edited once it is being processed.',
    cancelOwnOnly: 'You can only cancel your own reports.',
    cancelPendingOnly: 'This report can no longer be cancelled once it is being processed.',
    watchLocationExists: 'You are already watching this location.',
  },
  mk: {
    userExists: 'Веќе постои корисник со оваа е-пошта.',
    userNotFound: 'Корисникот не е пронајден.',
    invalidCredentials: 'Погрешна е-пошта или лозинка.',
    accountLocked: 'Сметката е привремено блокирана поради премногу неуспешни обиди. Обиди се повторно за {minutes} минути.',
    issueNotFound: 'Пријавата не е пронајдена.',
    imageOnly: 'Дозволени се само слики (jpg, jpeg, png, webp).',
    forbiddenRole: 'Немаш пристап до оваа акција.',
    editOwnOnly: 'Можеш да ги уредуваш само своите пријави.',
    editPendingOnly: 'Пријавата не може да се уредува откако ќе започне да се обработува.',
    cancelOwnOnly: 'Можеш да ги откажеш само своите пријави.',
    cancelPendingOnly: 'Пријавата не може да се откаже откако ќе започне да се обработува.',
    watchLocationExists: 'Веќе ја следиш оваа локација.',
  },
};

export function t(lang: Lang, key: string): string {
  return MESSAGES[lang]?.[key] ?? MESSAGES.sq[key] ?? key;
}

/** Reads the active language from the 'x-lang' header sent by the frontend. */
export function resolveLang(req: any): Lang {
  const header = req?.headers?.['x-lang'];
  if (header === 'en' || header === 'mk' || header === 'sq') return header;
  return 'sq';
}
