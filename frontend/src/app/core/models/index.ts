export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  studentIndex?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export type IssueStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';
export type IssueUrgency = 'low' | 'medium' | 'high';

export interface Issue {
  id: string;
  title: string;
  description: string;
  location?: string;
  imageUrl?: string;
  imageUrlsJson?: string | null;
  status: IssueStatus;
  urgency: IssueUrgency;
  isPossibleDuplicate: boolean;
  category: Category;
  reportedBy: User;
  createdAt: string;
  resolvedAt?: string;
}

export interface PublicStats {
  total: number;
  resolved: number;
  resolutionRate: number;
  byCategory: { category: string; count: string }[];
}

export interface IssueComment {
  id: string;
  text: string;
  author: User;
  createdAt: string;
}

export interface Analytics {
  total: number;
  byStatus: { status: string; count: string }[];
  byCategory: { category: string; count: string }[];
  byUrgency: { urgency: string; count: string }[];
  avgResolutionHours: number;
}

export interface TrendPoint {
  day: string;
  count: number;
}

export interface UserStats {
  total: number;
  resolved: number;
  pending: number;
  inProgress: number;
}

export interface AppNotification {
  id: string;
  messageKey: string;
  params?: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export interface MapPoint {
  issue_id: string;
  issue_title: string;
  issue_status: IssueStatus;
  issue_urgency: IssueUrgency;
  issue_latitude: number;
  issue_longitude: number;
  issue_location: string;
  categoryName: string;
}
