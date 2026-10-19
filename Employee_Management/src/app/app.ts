
import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  NavigationEnd
} from '@angular/router';

import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {

  showSidebar = false;
  currentRole = '';

  get isAdmin(): boolean {
    return this.currentRole === 'admin';
  }

  get canManageEmployees(): boolean {
    return this.currentRole === 'admin' || this.currentRole === 'manager';
  }

  private routerSubscription?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateSidebar();

    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.updateSidebar();
      });
  }

  private updateSidebar(): void {
    const currentUrl = this.router.url;

    const isLoginOrRegister =
      currentUrl.startsWith('/login') ||
      currentUrl.startsWith('/register');

    let user: any = null;

    try {
      user = JSON.parse(
        localStorage.getItem('currentUser') || 'null'
      );
    } catch {
      user = null;
    }

    this.currentRole = String(
      user?.role || ''
    ).toLowerCase();

    this.showSidebar =
      !isLoginOrRegister && !!user;
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
  logout(): void {
  localStorage.removeItem('currentUser');
  this.router.navigate(['/login']);
}
}