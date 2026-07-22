import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { TranslationService } from '../services/translation.service';

// Attaches the JWT bearer token (if present) and the active UI language
// to every outgoing API request, so backend error/notification messages
// come back in the same language the person is currently using.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const translation = inject(TranslationService);
  const token = auth.getToken();

  const headers: Record<string, string> = { 'x-lang': translation.lang() };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const cloned = req.clone({ setHeaders: headers });
  return next(cloned);
};
