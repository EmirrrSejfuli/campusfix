import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { User, UserStats } from '../models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  getMe(): Observable<User> {
    return this.http.get<User>(`${API_BASE_URL}/users/me`);
  }

  getMyStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${API_BASE_URL}/users/me/stats`);
  }
}
