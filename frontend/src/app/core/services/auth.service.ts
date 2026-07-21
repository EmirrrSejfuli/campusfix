import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthResponse, User, UserRole } from '../models';

const TOKEN_KEY = 'campusfix_token';
const USER_KEY = 'campusfix_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals hold auth state in-memory and are re-hydrated from localStorage on startup.
  currentUser = signal<User | null>(this.readStoredUser());
  isAuthenticated = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);

  constructor(private http: HttpClient, private router: Router) {}

  register(fullName: string, email: string, password: string, studentIndex?: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/register`, { fullName, email, password, studentIndex })
      .pipe(tap((res) => this.persistSession(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private persistSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
