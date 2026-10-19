import { Routes } from '@angular/router';

import { Dashboard } from './dashboard/dashboard';
import { Employees } from './employees/employees';
import { Department } from './department/department';
import { Attendance } from './attendance/attendance';
import { Login } from './login/login';
import { Register } from './register/register';
import { Leave } from './leave/leave';
import { Profile } from './profile/profile';
import { Payroll } from './payroll/payroll';
import { Announcements } from './announcements/announcements';
import { Performance } from './performance/performance';
import { Tasks } from './tasks/tasks';
import { Notifications } from './notification/notification';

export const routes: Routes = [

  // Default
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Authentication
  {
    path: 'login',
    component: Login
  },

  {
    path: 'register',
    component: Register
  },

  // Main pages
  {
    path: 'dashboard',
    component: Dashboard
  },

  {
    path: 'employees',
    component: Employees
  },

  {
    path: 'department',
    component: Department
  },


  {
    path: 'attendance',
    component: Attendance
  },

  {
    path: 'leave',
    component: Leave
  },

  {
    path: 'profile',
    component: Profile
  },

  {
    path: 'payroll',
    component: Payroll
  },

  {
    path: 'announcements',
    component: Announcements
  },

  {
    path: 'performance',
    component: Performance
  },

  {
    path: 'tasks',
    component: Tasks
  },

  {
    path: 'notifications',
    component: Notifications
  },

  // Unknown route
  {
    path: '**',
    redirectTo: 'login'
  }
];