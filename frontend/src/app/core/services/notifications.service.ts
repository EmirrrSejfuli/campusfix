import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AppNotification } from '../models';

// Raw shape returned by the backend before parsing paramsJson into an object.
interface RawNotification {
  id: string;
  messageKey: string;
  paramsJson: string | null;
  isRead: boolean;
  createdAt: string;
}

function parseNotification(raw: RawNotification): AppNotification {
  return {
    id: raw.id,
    messageKey: raw.messageKey,
    params: raw.paramsJson ? JSON.parse(raw.paramsJson) : undefined,
    isRead: raw.isRead,
    createdAt: raw.createdAt,
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<AppNotification[]> {
    return this.http
      .get<RawNotification[]>(`${API_BASE_URL}/notifications`)
      .pipe(map((list) => list.map(parseNotification)));
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${API_BASE_URL}/notifications/unread-count`);
  }

  markRead(id: string): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/notifications/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/notifications/read-all`, {});
  }
}
