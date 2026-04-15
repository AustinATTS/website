import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', loadComponent: () => import('./features/about/about').then(m => m.About) },
  { path: 'experience', loadComponent: () => import('./features/experience/experience').then(m => m.Experience) },
  { path: 'projects', loadComponent: () => import('./features/projects/projects').then(m => m.ProjectsPage) },
  { path: 'projects/:slug', loadComponent: () => import('./features/projects/project-detail/project-detail').then(m => m.ProjectDetail) },
  { path: 'blog', loadComponent: () => import('./features/blog/blog').then(m => m.Blog) },
  { path: 'blog/:slug', loadComponent: () => import('./features/blog/blog-post').then(m => m.BlogPost) },
  { path: 'forum', loadComponent: () => import('./features/forum/forum').then(m => m.Forum) },
  { path: 'forum/:slug', loadComponent: () => import('./features/forum/forum-thread').then(m => m.ForumThread) },
  { path: 'polls', loadComponent: () => import('./features/polls/polls').then(m => m.Polls) },
  { path: 'contact', loadComponent: () => import('./features/contact/contact').then(m => m.Contact) },

  { path: 'login', loadComponent: () => import('./features/auth/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./features/auth/register').then(m => m.Register) },

  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout').then(m => m.AdminLayout),
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'blogs', loadComponent: () => import('./features/admin/blog-management/blog-management').then(m => m.BlogManagement) },
      { path: 'projects', loadComponent: () => import('./features/admin/project-management/project-management').then(m => m.ProjectManagement) },
      { path: 'forums', loadComponent: () => import('./features/admin/forum-management/forum-management').then(m => m.ForumManagement) },
      { path: 'polls', loadComponent: () => import('./features/admin/poll-management/poll-management').then(m => m.PollManagement) },
      { path: 'users', loadComponent: () => import('./features/admin/user-management/user-management').then(m => m.UserManagement) },
      { path: 'comments', loadComponent: () => import('./features/admin/comment-management/comment-management').then(m => m.CommentManagement) },
      { path: 'messages', loadComponent: () => import('./features/admin/message-management/message-management').then(m => m.MessageManagement) },
    ],
  },

  { path: '**', redirectTo: '' },
];
