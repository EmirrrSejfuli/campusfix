import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { IssueComment } from '../models';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  constructor(private http: HttpClient) {}

  getForIssue(issueId: string): Observable<IssueComment[]> {
    return this.http.get<IssueComment[]>(`${API_BASE_URL}/issues/${issueId}/comments`);
  }

  create(issueId: string, text: string): Observable<IssueComment> {
    return this.http.post<IssueComment>(`${API_BASE_URL}/issues/${issueId}/comments`, { text });
  }
}
