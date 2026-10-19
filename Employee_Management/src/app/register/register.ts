
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  name = '';
  email = '';
  employeeId = '';
  department = '';
  password = '';
  confirmPassword = '';

  showPassword = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  // Kept so existing HTML bindings won't break.
  // The backend assigns the Employee role to public registrations.
  role: 'employee' | 'manager' = 'employee';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isLoading) {
      return;
    }

    if (
      !this.name.trim() ||
      !this.email.trim() ||
      !this.employeeId.trim() ||
      !this.department ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    const email = this.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage =
        'Password must contain at least 8 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    const employeeIdText = this.employeeId.trim();

    // The API expects an integer EmployeeId, if supplied.
    const parsedEmployeeId = Number(employeeIdText);

    if (
      employeeIdText &&
      (!Number.isInteger(parsedEmployeeId) || parsedEmployeeId <= 0)
    ) {
      this.errorMessage = 'Employee ID must be a valid positive number.';
      return;
    }

    this.isLoading = true;

    this.authService.register({
      fullName: this.name.trim(),
      email,
      password: this.password,
      employeeId: parsedEmployeeId
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Account created successfully! You can now log in.';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 0) {
          this.errorMessage =
            'Cannot connect to the API. Check that the API is running and its HTTPS certificate is trusted.';
        } else if (error.status === 409) {
          this.errorMessage =
            error.error?.message || 'This account is already registered.';
        } else if (error.status === 400) {
          const errors = error.error?.errors;

          this.errorMessage =
            error.error?.message ||
            (Array.isArray(errors) ? errors.join(' ') : '') ||
            'Registration failed. Check your details and password requirements.';
        } else {
          this.errorMessage =
            error.error?.message || 'Registration failed. Please try again.';
        }
      }
    });
  }
}