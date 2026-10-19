
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  Employee,
  EmployeeForm,
  EmployeeService,
  Department
} from '../services/employee';

import { DepartmentService } from '../services/department.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.html',
  styleUrl: './employees.css'
})
export class Employees implements OnInit, OnDestroy {

  // All employees returned by the API
  employees: Employee[] = [];

  // Employees displayed in the main directory
  filteredEmployees: Employee[] = [];

  departments: Department[] = [];

  searchText = '';
  showForm = false;
  editingId: number | null = null;
  showPassword = false;
  showConfirmPassword = false;

  form: EmployeeForm = this.createEmptyForm();

  private employeesSubscription?: Subscription;
  private departmentsSubscription?: Subscription;

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getEmployees();
    this.loadDepartments();
  }

  // ==========================================
  // LOAD EMPLOYEES
  // ==========================================

  private getEmployees(): void {
    this.employeesSubscription?.unsubscribe();

    this.employeesSubscription = this.employeeService
      .getEmployees()
      .subscribe({
        next: (employees: Employee[]) => {
          this.employees = Array.isArray(employees)
            ? [...employees]
            : [];

          // Display active employees only.
          this.applyEmployeeFilter();

          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('EMPLOYEE API ERROR:', error);

          this.employees = [];
          this.filteredEmployees = [];

          alert('Unable to load employees from the server.');
          this.cdr.detectChanges();
        }
      });
  }

  // ==========================================
  // FILTER ACTIVE EMPLOYEES AND SEARCH
  // ==========================================

  private applyEmployeeFilter(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredEmployees = this.employees.filter(
      (employee: Employee) => {
        // Hide inactive employees from the main directory.
        if (
          String(employee.status || '').toLowerCase() !== 'active'
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        const name = String(employee.name || '').toLowerCase();
        const email = String(employee.email || '').toLowerCase();
        const department = String(
          employee.department?.name || ''
        ).toLowerCase();
        const position = String(
          employee.position || ''
        ).toLowerCase();
        const phone = String(employee.phone || '').toLowerCase();

        return (
          name.includes(search) ||
          email.includes(search) ||
          department.includes(search) ||
          position.includes(search) ||
          phone.includes(search)
        );
      }
    );
  }

  onSearch(): void {
    this.applyEmployeeFilter();
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================

  private loadDepartments(): void {
    this.departmentsSubscription?.unsubscribe();

    this.departmentsSubscription = this.departmentService
      .getDepartments()
      .subscribe({
        next: (departments: Department[]) => {
          this.departments = Array.isArray(departments)
            ? [...departments]
            : [];

          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('DEPARTMENT API ERROR:', error);
          this.departments = [];
        }
      });
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  ngOnDestroy(): void {
    this.employeesSubscription?.unsubscribe();
    this.departmentsSubscription?.unsubscribe();
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  get totalEmployees(): number {
    return this.employees.length;
  }

  get activeEmployees(): number {
    return this.employees.filter(
      (employee: Employee) =>
        String(employee.status || '').toLowerCase() === 'active'
    ).length;
  }

  get inactiveEmployees(): number {
    return this.employees.filter(
      (employee: Employee) =>
        String(employee.status || '').toLowerCase() === 'inactive'
    ).length;
  }

  // ==========================================
  // ADD EMPLOYEE
  // ==========================================

  openAddForm(): void {
    this.editingId = null;
    this.form = this.createEmptyForm();
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.showForm = true;
  }

  // ==========================================
  // EDIT EMPLOYEE
  // ==========================================

  editEmployee(employee: Employee): void {
    this.editingId = employee.id;

    this.form = {
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      salary: Number(employee.salary) || 0,
      joiningDate: String(employee.joiningDate || '').substring(0, 10),
      status: employee.status || 'Active',
      departmentId: Number(employee.departmentId) || 0,
      password: '',
      confirmPassword: ''
    };

    this.showPassword = false;
    this.showConfirmPassword = false;
    this.showForm = true;
  }

  // ==========================================
  // SAVE EMPLOYEE
  // ==========================================

  saveEmployee(): void {
    if (
      !this.form.name.trim() ||
      !this.form.email.trim() ||
      !this.form.position.trim()
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    const departmentId = Number(this.form.departmentId);

    if (departmentId <= 0) {
      alert('Please select a department.');
      return;
    }

    // ADD NEW EMPLOYEE
    if (this.editingId === null) {
      if (!this.form.password) {
        alert('Please enter a password.');
        return;
      }

      if (this.form.password !== this.form.confirmPassword) {
        alert('Password and Confirm Password do not match.');
        return;
      }

      const employeeData: EmployeeForm = {
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim(),
        position: this.form.position.trim(),
        salary: Number(this.form.salary) || 0,
        joiningDate: this.form.joiningDate,
        status: this.form.status,
        departmentId,
        password: this.form.password,
        confirmPassword: this.form.confirmPassword
      };

      this.employeeService.addEmployee(employeeData).subscribe({
        next: (response: any) => {
          console.log('EMPLOYEE CREATED:', response);

          alert('Employee created successfully.');

          this.cancelForm();
          this.getEmployees();
        },
        error: (error: any) => {
          console.error('ADD EMPLOYEE ERROR:', error);

          alert(
            error?.error?.message ||
            'Unable to create employee.'
          );
        }
      });

      return;
    }

    // UPDATE EXISTING EMPLOYEE
    const updatedEmployee: Partial<Employee> = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      position: this.form.position.trim(),
      salary: Number(this.form.salary) || 0,
      joiningDate: this.form.joiningDate,
      status: this.form.status,
      departmentId
    };

    this.employeeService
      .updateEmployee(this.editingId, updatedEmployee)
      .subscribe({
        next: () => {
          alert('Employee updated successfully.');

          this.cancelForm();
          this.getEmployees();
        },
        error: (error: any) => {
          console.error('UPDATE EMPLOYEE ERROR:', error);

          alert(
            error?.error?.message ||
            'Unable to update employee.'
          );
        }
      });
  }

  // ==========================================
  // TOGGLE EMPLOYEE STATUS
  // ==========================================

  toggleStatus(employee: Employee): void {
    const newStatus =
      String(employee.status || '').toLowerCase() === 'active'
        ? 'Inactive'
        : 'Active';

    const updatedEmployee: Partial<Employee> = {
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      salary: employee.salary,
      joiningDate: employee.joiningDate,
      status: newStatus,
      departmentId: employee.departmentId
    };

    this.employeeService
      .updateEmployee(employee.id, updatedEmployee)
      .subscribe({
        next: () => {
          alert(`Employee status changed to ${newStatus}.`);
          this.getEmployees();
        },
        error: (error: any) => {
          console.error('STATUS UPDATE ERROR:', error);

          alert(
            error?.error?.message ||
            'Unable to update employee status.'
          );
        }
      });
  }

  // ==========================================
  // DELETE / SOFT DELETE EMPLOYEE
  // ==========================================

  deleteEmployee(employee: Employee): void {
    const confirmed = confirm(
      `Are you sure you want to mark ${employee.name} as inactive?`
    );

    if (!confirmed) {
      return;
    }

    this.employeeService
      .deleteEmployee(employee.id)
      .subscribe({
        next: (response: any) => {
          console.log('EMPLOYEE MARKED INACTIVE:', response);

          // Update the local record immediately.
          const existingEmployee = this.employees.find(
            item => item.id === employee.id
          );

          if (existingEmployee) {
            existingEmployee.status = 'Inactive';
          }

          this.applyEmployeeFilter();

          alert('Employee marked as inactive successfully.');

          // Refresh from the database to confirm the saved status.
          this.getEmployees();
        },
        error: (error: any) => {
          console.error('DELETE EMPLOYEE ERROR:', error);

          alert(
            error?.error?.message ||
            'Unable to mark employee as inactive.'
          );
        }
      });
  }

  // ==========================================
  // CANCEL FORM
  // ==========================================

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.form = this.createEmptyForm();
  }

  // ==========================================
  // EMPTY FORM
  // ==========================================

  private createEmptyForm(): EmployeeForm {
    return {
      name: '',
      email: '',
      phone: '',
      position: '',
      salary: 0,
      joiningDate: new Date().toISOString().substring(0, 10),
      status: 'Active',
      departmentId: 0,
      password: '',
      confirmPassword: ''
    };
  }
}
