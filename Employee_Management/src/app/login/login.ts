
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  showPassword = false;
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  login(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.authService.login({
      email: this.email.trim().toLowerCase(),
      password: this.password
    }).subscribe({
      next: response => {
  this.isLoading = false;

  const apiUser = response.user;

  const role =
    apiUser?.roles?.[0]?.toLowerCase() || 'employee';

  const employeeId =
    apiUser?.employeeId ?? null;

  localStorage.setItem(
    'currentUser',
    JSON.stringify({
      name:
        apiUser?.fullName ||
        this.email.split('@')[0],

      fullName:
        apiUser?.fullName ||
        this.email.split('@')[0],

      email:
        apiUser?.email ||
        this.email.trim().toLowerCase(),

      role,

      employeeId,

      department:
        apiUser?.department || null
    })
  );

  console.log(
    'Logged-in user:',
    JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    )
  );

  this.router.navigate(['/dashboard']);
},
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 0) {
          this.errorMessage =
            'Cannot connect to the API. Check that the API is running and the HTTPS certificate is trusted.';
        } else if (error.status === 401) {
          this.errorMessage = 'Invalid email or password.';
        } else {
          this.errorMessage =
            error.error?.message || 'Login failed. Please try again.';
        }
      }
    });
  }
}