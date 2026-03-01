import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ✅ single default redirect (remove the duplicate one)
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () =>
      import('./features/student/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent)
  },

  {
    path: 'professor',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['professor'] },
    loadComponent: () =>
      import('./features/professor/professor-dashboard/professor-dashboard.component').then(m => m.ProfessorDashboardComponent)
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () =>
      import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },

  // ✅ fallback
  {
    path: '**',
    redirectTo: '/home'
  }
];