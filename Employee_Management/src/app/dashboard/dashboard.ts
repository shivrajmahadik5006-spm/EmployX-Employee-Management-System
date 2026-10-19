import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  Employee,
  EmployeeService
} from '../services/employee';

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    DatePipe
  ],

  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {

  employees: Employee[] = [];

  currentUser: any = null;

  userName = 'User';

  userRole = 'Employee';

  userEmail = '';

  today = new Date();

  private employeeSubscription?: Subscription;


  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {}


  // =====================================================
  // INITIALIZE
  // =====================================================

  ngOnInit(): void {

    console.log('Dashboard component started.');

    this.loadCurrentUser();

    this.loadEmployees();

  }


  // =====================================================
  // LOAD EMPLOYEES
  // =====================================================

  private loadEmployees(): void {

    console.log(
      'Dashboard: Loading employees from API...'
    );

    this.employeeSubscription?.unsubscribe();

    this.employeeSubscription =
      this.employeeService
        .getEmployees()
        .subscribe({

          next: (employees: Employee[]) => {

            console.log(
              'DASHBOARD EMPLOYEE API RESPONSE:',
              employees
            );

            this.employees =
              Array.isArray(employees)
                ? [...employees]
                : [];

            console.log(
              'DASHBOARD EMPLOYEES:',
              this.employees
            );

            console.log(
              'DASHBOARD TOTAL:',
              this.employees.length
            );

            console.log(
              'DASHBOARD ACTIVE:',
              this.activeEmployees
            );

            console.log(
              'DASHBOARD INACTIVE:',
              this.inactiveEmployees
            );

            // Refresh Angular template
            this.cdr.detectChanges();

          },

          error: (error: any) => {

            console.error(
              'DASHBOARD EMPLOYEE API ERROR:',
              error
            );

            this.employees = [];

            this.cdr.detectChanges();

          }

        });

  }


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.employeeSubscription
      ?.unsubscribe();

  }


  // =====================================================
  // CURRENT USER
  // =====================================================

  loadCurrentUser(): void {

    try {

      this.currentUser =
        JSON.parse(
          localStorage.getItem(
            'currentUser'
          ) || 'null'
        );

    } catch (error) {

      console.error(
        'Unable to read current user:',
        error
      );

      this.currentUser = null;

    }


    if (!this.currentUser) {

      return;

    }


    this.userName =
      this.currentUser.name ||
      this.currentUser.fullName ||
      'User';


    this.userEmail =
      this.currentUser.email ||
      '';


    const role =
      this.currentUser.role ||
      'employee';


    this.userRole =
      String(role)
        .charAt(0)
        .toUpperCase() +

      String(role)
        .slice(1)
        .toLowerCase();

  }


  // =====================================================
  // TOTAL EMPLOYEES
  // =====================================================

  get totalEmployees(): number {

    return this.employees.length;

  }


  // =====================================================
  // ACTIVE EMPLOYEES
  // =====================================================

  get activeEmployees(): number {

    return this.employees.filter(
      (employee: Employee) =>
        String(employee.status)
          .toLowerCase() === 'active'
    ).length;

  }


  // =====================================================
  // INACTIVE EMPLOYEES
  // =====================================================

  get inactiveEmployees(): number {

    return this.employees.filter(
      (employee: Employee) =>
        String(employee.status)
          .toLowerCase() === 'inactive'
    ).length;

  }


  // =====================================================
  // DEPARTMENT COUNT
  // =====================================================

  get departmentCount(): number {

    const departments =
      this.employees

        .map(
          (employee: Employee) =>
            employee.department?.name || ''
        )

        .filter(
          (department: string) =>
            department.length > 0
        );


    return new Set(
      departments
    ).size;

  }


  // =====================================================
  // DEPARTMENT STATISTICS
  // =====================================================

  get departmentStats(): {
    name: string;
    count: number;
    percentage: number;
  }[] {

    const departmentMap =
      new Map<string, number>();


    this.employees.forEach(
      (employee: Employee) => {

        const departmentName =
          employee.department?.name ||
          'Unknown';


        departmentMap.set(

          departmentName,

          (
            departmentMap.get(
              departmentName
            ) || 0
          ) + 1

        );

      }
    );


    const total =
      this.totalEmployees;


    return Array.from(
      departmentMap.entries()
    )

      .map(
        (
          [name, count]: [string, number]
        ) => ({

          name,

          count,

          percentage:
            total > 0
              ? Math.round(
                  (count / total) * 100
                )
              : 0

        })
      )

      .sort(
        (
          a: {
            name: string;
            count: number;
            percentage: number;
          },

          b: {
            name: string;
            count: number;
            percentage: number;
          }
        ) =>
          b.count - a.count
      )

      .slice(0, 6);

  }


  // =====================================================
  // RECENT EMPLOYEES
  // =====================================================

  get recentEmployees(): Employee[] {

    return [...this.employees]

      .filter(
        (employee: Employee) =>
          employee.joiningDate != null &&
          employee.joiningDate !== ''
      )

      .sort(
        (
          a: Employee,
          b: Employee
        ) => {

          const aDate =
            new Date(
              String(a.joiningDate)
            ).getTime();

          const bDate =
            new Date(
              String(b.joiningDate)
            ).getTime();

          return bDate - aDate;

        }
      )

      .slice(0, 5);

  }


  // =====================================================
  // ROLE CHECKS
  // =====================================================

  get isAdmin(): boolean {

    return (
      this.userRole
        .toLowerCase() ===
      'admin'
    );

  }


  get isManager(): boolean {

    return (
      this.userRole
        .toLowerCase() ===
      'manager'
    );

  }


  get isEmployee(): boolean {

    return (
      this.userRole
        .toLowerCase() ===
      'employee'
    );

  }


  // =====================================================
  // WELCOME MESSAGE
  // =====================================================

  get welcomeMessage(): string {

    if (this.isAdmin) {

      return 'Manage your organization and monitor your workforce.';

    }


    if (this.isManager) {

      return 'Review your workforce, attendance, and employee information.';

    }


    return 'View your work information and stay up to date.';

  }


  // =====================================================
  // USER INITIALS
  // =====================================================

  get initials(): string {

    return this.userName

      .split(' ')

      .filter(
        (name: string) =>
          name.length > 0
      )

      .map(
        (name: string) =>
          name.charAt(0)
      )

      .slice(0, 2)

      .join('')

      .toUpperCase();

  }

}