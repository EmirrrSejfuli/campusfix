import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface Watch {
  id: string;
  location: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class WatchesService {
  constructor(private http: HttpClient) {}

  create(location: string): Observable<Watch> {
    return this.http.post<Watch>(`${API_BASE_URL}/watches`, { location });
  }

  getMine(): Observable<Watch[]> {
    return this.http.get<Watch[]>(`${API_BASE_URL}/watches/mine`);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/watches/${id}`);
  }
}
