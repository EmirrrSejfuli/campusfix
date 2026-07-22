import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { Analytics, Category, Issue, TrendPoint, MapPoint, PublicStats } from '../models';

export interface IssueFilters {
  status?: string;
  urgency?: string;
  categoryId?: string;
  search?: string;
  mine?: string;
}

@Injectable({ providedIn: 'root' })
export class IssuesService {
  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${API_BASE_URL}/categories`);
  }

  createIssue(formData: FormData): Observable<Issue> {
    return this.http.post<Issue>(`${API_BASE_URL}/issues`, formData);
  }

  getIssues(filters: IssueFilters = {}): Observable<Issue[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<Issue[]>(`${API_BASE_URL}/issues`, { params });
  }

  getIssue(id: string): Observable<Issue> {
    return this.http.get<Issue>(`${API_BASE_URL}/issues/${id}`);
  }

  updateIssue(id: string, changes: { status?: string; urgency?: string }): Observable<Issue> {
    return this.http.patch<Issue>(`${API_BASE_URL}/issues/${id}`, changes);
  }

  deleteIssue(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/issues/${id}`);
  }

  getAnalytics(): Observable<Analytics> {
    return this.http.get<Analytics>(`${API_BASE_URL}/issues/analytics/summary`);
  }

  getTrend(days = 30): Observable<TrendPoint[]> {
    return this.http.get<TrendPoint[]>(`${API_BASE_URL}/issues/analytics/trend`, { params: { days } });
  }

  getTopUrgent(): Observable<Issue[]> {
    return this.http.get<Issue[]>(`${API_BASE_URL}/issues/analytics/top-urgent`);
  }

  updateOwnIssue(id: string, changes: { title?: string; description?: string; location?: string }): Observable<Issue> {
    return this.http.patch<Issue>(`${API_BASE_URL}/issues/${id}/mine`, changes);
  }

  cancelOwnIssue(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/issues/${id}/mine`);
  }

  getMapPoints(): Observable<MapPoint[]> {
    return this.http.get<MapPoint[]>(`${API_BASE_URL}/issues/map`);
  }

  getByLocation(): Observable<{ location: string; count: string }[]> {
    return this.http.get<{ location: string; count: string }[]>(`${API_BASE_URL}/issues/analytics/by-location`);
  }

  bulkUpdate(ids: string[], changes: { status?: string; urgency?: string }): Observable<Issue[]> {
    return this.http.patch<Issue[]>(`${API_BASE_URL}/issues/bulk`, { ids, ...changes });
  }

  getPublicStats(): Observable<PublicStats> {
    return this.http.get<PublicStats>(`${API_BASE_URL}/public-stats`);
  }

  rateIssue(id: string, rating: number): Observable<Issue> {
    return this.http.post<Issue>(`${API_BASE_URL}/issues/${id}/rating`, { rating });
  }

  toggleConfirmation(id: string): Observable<{ confirmed: boolean; count: number }> {
    return this.http.post<{ confirmed: boolean; count: number }>(`${API_BASE_URL}/issues/${id}/confirm`, {});
  }

  getConfirmationState(id: string): Observable<{ confirmed: boolean; count: number }> {
    return this.http.get<{ confirmed: boolean; count: number }>(`${API_BASE_URL}/issues/${id}/confirm`);
  }
}
