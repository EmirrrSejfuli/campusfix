import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'report',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./student/report-issue/report-issue.component').then((m) => m.ReportIssueComponent),
  },
  {
    path: 'my-issues',
    canActivate: [authGuard],
    loadComponent: () => import('./student/my-issues/my-issues.component').then((m) => m.MyIssuesComponent),
  },
  {
    path: 'browse',
    canActivate: [authGuard],
    loadComponent: () => import('./student/browse-issues/browse-issues.component').then((m) => m.BrowseIssuesComponent),
  },
  {
    path: 'map',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/campus-map/campus-map.component').then((m) => m.CampusMapComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'issues/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/issue-detail/issue-detail.component').then((m) => m.IssueDetailComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'admin/issues',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin/manage-issues/manage-issues.component').then((m) => m.ManageIssuesComponent),
  },
  {
    path: 'stats',
    loadComponent: () => import('./public/public-stats/public-stats.component').then((m) => m.PublicStatsComponent),
  },
  {
    path: 'admin/qr',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/qr-generator/qr-generator.component').then((m) => m.QrGeneratorComponent),
  },
  {
    path: 'admin/users',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/manage-users/manage-users.component').then((m) => m.ManageUsersComponent),
  },
  { path: '**', redirectTo: 'login' },
];
