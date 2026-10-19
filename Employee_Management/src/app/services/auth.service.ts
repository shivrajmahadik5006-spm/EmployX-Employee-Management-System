
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  employeeId?: number;
}

export interface AuthResponse {
  token: string;
  expiresAt?: string;
  message?: string;
  user?: {
    id?: string;
    userId?: string;
    fullName?: string;
    email?: string;
    roles?: string[];
    employeeId?: number | null;
  department?: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'https://localhost:7246/api/Auth';
  private readonly tokenKey = 'employx_token';

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem(this.tokenKey, response.token);
          }
        })
      );
  }

  register(data: RegisterRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('currentUser');
  }
}