import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  Employee,
  EmployeeService
} from '../services/employee';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  employee: Employee | undefined;

  accountName = '';
  accountEmail = '';
  accountRole = '';
  accountDepartment = '';

  profilePhoto = '';

  editMode = false;

  editName = '';
  editPhone = '';

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {

    let user: any = null;

    try {
      user = JSON.parse(
        localStorage.getItem('currentUser') || 'null'
      );
    } catch {
      user = null;
    }

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.accountName =
      user.name ||
      user.fullName ||
      'User';

    this.accountEmail =
      user.email ||
      '';

    this.accountRole =
      String(
        user.role || 'Employee'
      );

    this.accountDepartment =
      typeof user.department === 'string'
        ? user.department
        : user.department?.name || 'Not Assigned';

    /*
     * Load employee information from API
     */
    this.employeeService
      .getEmployees()
      .subscribe({

        next: (employees: Employee[]) => {

          this.employee =
            employees.find(
              (item: Employee) =>
                String(item.email || '')
                  .trim()
                  .toLowerCase() ===
                this.accountEmail
                  .trim()
                  .toLowerCase()
            );

          if (this.employee) {

            this.accountName =
              this.employee.name;

            this.accountEmail =
              this.employee.email;

            this.accountDepartment =
              this.employee.department?.name ||
              'Not Assigned';

            this.editName =
              this.employee.name;

            this.editPhone =
              this.employee.phone || '';

          } else {

            this.editName =
              this.accountName;

            this.editPhone = '';

            console.warn(
              'Employee record not found for:',
              this.accountEmail
            );
          }

        },

        error: (error: any) => {

          console.error(
            'Unable to load employee profile:',
            error
          );

          this.employee =
            undefined;

          this.editName =
            this.accountName;

          this.editPhone = '';

        }

      });

    /*
     * Load saved profile photo
     */
    this.profilePhoto =
      localStorage.getItem(
        'profilePhoto'
      ) || '';
  }

  get initials(): string {

    if (!this.accountName) {
      return 'U';
    }

    return this.accountName
      .split(' ')
      .filter(name => name.trim())
      .map(name => name.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  get roleLabel(): string {

    if (!this.accountRole) {
      return 'Employee';
    }

    return this.accountRole
      .charAt(0)
      .toUpperCase()
      +
      this.accountRole.slice(1);
  }

  get position(): string {

    return this.employee?.position ||
      'Not Assigned';
  }

  get phone(): string {

    return this.employee?.phone ||
      'Not Added';
  }

  get joiningDate(): string {

    return this.employee?.joiningDate ||
      '';
  }

  get salary(): number {

    return this.employee?.salary ||
      0;
  }

  startEdit(): void {

    this.editName =
      this.accountName;

    this.editPhone =
      this.employee?.phone || '';

    this.editMode = true;
  }

  cancelEdit(): void {

    this.editMode = false;

    this.editName =
      this.accountName;

    this.editPhone =
      this.employee?.phone || '';
  }

  saveProfile(): void {

    if (!this.editName.trim()) {
      alert('Please enter your name.');
      return;
    }

    this.accountName =
      this.editName.trim();

    /*
     * Update currentUser in localStorage
     */
    let user: any = {};

    try {
      user = JSON.parse(
        localStorage.getItem('currentUser') || '{}'
      );
    } catch {
      user = {};
    }

    user.name =
      this.accountName;

    user.fullName =
      this.accountName;

    user.email =
      this.accountEmail;

    user.role =
      this.accountRole;

    user.department =
      this.accountDepartment;

    localStorage.setItem(
      'currentUser',
      JSON.stringify(user)
    );

    /*
     * Update employee locally if available.
     *
     * Database update can be connected
     * through EmployeeService later.
     */
    if (this.employee) {

      this.employee = {
        ...this.employee,
        name: this.accountName,
        phone: this.editPhone
      };
    }

    this.editMode = false;

    alert(
      'Profile updated successfully.'
    );
  }

  onPhotoSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    const file =
      input.files[0];

    if (!file.type.startsWith('image/')) {
      alert(
        'Please select an image file.'
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {

      this.profilePhoto =
        reader.result as string;

      localStorage.setItem(
        'profilePhoto',
        this.profilePhoto
      );
    };

    reader.readAsDataURL(file);
  }

  removePhoto(): void {

    this.profilePhoto = '';

    localStorage.removeItem(
      'profilePhoto'
    );
  }

  logout(): void {

    const confirmed =
      confirm(
        'Are you sure you want to logout?'
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      'currentUser'
    );

    localStorage.removeItem(
      'employx_token'
    );

    this.router.navigate([
      '/login'
    ]);
  }
}