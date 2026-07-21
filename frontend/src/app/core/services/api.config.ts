import { environment } from '../../../environments/environment';

// Central place to configure the backend API base URL. Reads from the
// environment file, which is swapped automatically between dev and
// production builds (see angular.json fileReplacements).
export const API_BASE_URL = environment.apiUrl;
export const UPLOADS_BASE_URL = environment.uploadsBase;

/**
 * Builds a usable <img> src from a stored image URL. Handles both:
 *  - Absolute Cloudinary URLs (production) — used as-is.
 *  - Relative "/uploads/xxx" paths (local Docker fallback) — prefixed with the backend's base URL.
 */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `${UPLOADS_BASE_URL}${url}`;
}
