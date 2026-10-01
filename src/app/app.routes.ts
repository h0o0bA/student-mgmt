import { Routes } from '@angular/router';
import { unsavedGuard } from './core/unsaved.guard';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', loadComponent: () => import('./pages/overview').then((m) => m.Overview) },
  { path: 'students', loadComponent: () => import('./pages/students').then((m) => m.Students) },
  {
    path: 'students/new',
    loadComponent: () => import('./pages/student-form').then((m) => m.StudentForm),
    canDeactivate: [unsavedGuard],
  },
  {
    path: 'students/:id',
    loadComponent: () => import('./pages/student-form').then((m) => m.StudentForm),
    canDeactivate: [unsavedGuard],
  },
  { path: 'courses', loadComponent: () => import('./pages/courses').then((m) => m.Courses) },
  {
    path: 'courses/new',
    loadComponent: () => import('./pages/course-form').then((m) => m.CourseForm),
    canDeactivate: [unsavedGuard],
  },
  {
    path: 'courses/:id',
    loadComponent: () => import('./pages/course-form').then((m) => m.CourseForm),
    canDeactivate: [unsavedGuard],
  },
  { path: '**', loadComponent: () => import('./pages/not-found').then((m) => m.NotFound) },
];
