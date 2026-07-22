import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface AdminZone {
  id: string;
  zone: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminZonesService {
  constructor(private http: HttpClient) {}

  create(zone: string): Observable<AdminZone> {
    return this.http.post<AdminZone>(`${API_BASE_URL}/admin-zones`, { zone });
  }

  getMine(): Observable<AdminZone[]> {
    return this.http.get<AdminZone[]>(`${API_BASE_URL}/admin-zones/mine`);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/admin-zones/${id}`);
  }
}
