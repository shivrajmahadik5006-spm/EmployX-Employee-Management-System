import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  Employee,
  EmployeeForm,
  EmployeeService
} from '../services/employee';

import {
  Department,
  DepartmentService
} from '../services/department.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe
  ],
  templateUrl: './employees.html',
  styleUrl: './employees.css'
})
export class Employees implements OnInit, OnDestroy {

  employees: Employee[] = [];

  departments: Department[] = [];

  searchText = '';

  showForm = false;

  editingId: number | null = null;

  showPassword = false;

  showConfirmPassword = false;

  form: EmployeeForm =
    this.createEmptyForm();

  private employeesSubscription?: Subscription;

  private departmentsSubscription?: Subscription;

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {

    this.employeesSubscription =
      this.employeeService.employees$
        .subscribe(
          (employees: Employee[]) => {

            this.employees = employees;

          }
        );

    this.loadDepartments();
  }

  loadDepartments(): void {

    this.departmentsSubscription =
      this.departmentService
        .getDepartments()
        .subscribe({

          next: (departments) => {

            this.departments =
              departments;

            console.log(
              'Departments loaded:',
              departments
            );

          },

          error: (error) => {

            console.error(
              'Error loading departments:',
              error
            );

            alert(
              'Unable to load departments.'
            );

          }

        });
  }

  ngOnDestroy(): void {

    this.employeesSubscription
      ?.unsubscribe();

    this.departmentsSubscription
      ?.unsubscribe();

  }

  get totalEmployees(): number {

    return this.employees.length;

  }

  get activeEmployees(): number {

    return this.employees.filter(
      employee =>
        employee.status === 'Active'
    ).length;

  }

  get inactiveEmployees(): number {

    return this.employees.filter(
      employee =>
        employee.status === 'Inactive'
    ).length;

  }

  get filteredEmployees(): Employee[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (!search) {

      return this.employees;

    }

    return this.employees.filter(
      employee => {

        const departmentName =
          employee.department?.name || '';

        return (

          employee.name
            .toLowerCase()
            .includes(search)

          ||

          employee.email
            .toLowerCase()
            .includes(search)

          ||

          departmentName
            .toLowerCase()
            .includes(search)

          ||

          employee.position
            .toLowerCase()
            .includes(search)

        );

      }
    );
  }

  openAddForm(): void {

    this.editingId = null;

    this.form =
      this.createEmptyForm();

    this.showPassword = false;

    this.showConfirmPassword = false;

    this.showForm = true;

  }

  editEmployee(
    employee: Employee
  ): void {

    this.editingId =
      employee.id;

    this.form = {

      name:
        employee.name,

      email:
        employee.email,

      phone:
        employee.phone,

      position:
        employee.position,

      salary:
        employee.salary,

      joiningDate:
        employee.joiningDate
          ? employee.joiningDate
              .substring(0, 10)
          : '',

      status:
        employee.status,

      departmentId:
        employee.departmentId,

      password: '',

      confirmPassword: ''

    };

    this.showPassword = false;

    this.showConfirmPassword = false;

    this.showForm = true;

  }

  saveEmployee(): void {

    if (!this.form.name.trim()) {

      alert(
        'Please enter employee name.'
      );

      return;

    }

    if (!this.form.email.trim()) {

      alert(
        'Please enter employee email.'
      );

      return;

    }

    if (!this.form.position.trim()) {

      alert(
        'Please enter employee position.'
      );

      return;

    }

    if (
      !this.form.departmentId ||
      this.form.departmentId <= 0
    ) {

      alert(
        'Please select a department.'
      );

      return;

    }

    /*
     * CREATE NEW EMPLOYEE
     */
    if (this.editingId === null) {

      if (!this.form.password) {

        alert(
          'Please enter a password.'
        );

        return;

      }

      if (
        this.form.password.length < 6
      ) {

        alert(
          'Password must contain at least 6 characters.'
        );

        return;

      }

      if (
        this.form.password !==
        this.form.confirmPassword
      ) {

        alert(
          'Password and Confirm Password do not match.'
        );

        return;

      }

      const employeeData: EmployeeForm = {

        name:
          this.form.name.trim(),

        email:
          this.form.email.trim(),

        phone:
          this.form.phone.trim(),

        position:
          this.form.position.trim(),

        salary:
          Number(this.form.salary) || 0,

        joiningDate:
          this.form.joiningDate,

        status:
          this.form.status,

        departmentId:
          Number(this.form.departmentId),

        password:
          this.form.password,

        confirmPassword:
          this.form.confirmPassword

      };

      console.log(
        'Employee data being sent:',
        employeeData
      );

      this.employeeService
        .addEmployee(employeeData)
        .subscribe({

          next: (response) => {

            console.log(
              'Employee created:',
              response
            );

            alert(
              'Employee and login account created successfully.\n\n' +
              'Login Email: ' +
              response.login.email
            );

            this.employeeService
              .loadEmployees();

            this.cancelForm();

          },

          error: (error) => {

            console.error(
              'ADD EMPLOYEE ERROR'
            );

            console.error(
              'Status:',
              error.status
            );

            console.error(
              'Message:',
              error.message
            );

            console.error(
              'Response:',
              error.error
            );

            alert(
              error.error?.message ||
              'Unable to create employee.'
            );

          }

        });

      return;
    }

    /*
     * UPDATE EXISTING EMPLOYEE
     */
    const employee: Employee = {

      id:
        this.editingId,

      name:
        this.form.name.trim(),

      email:
        this.form.email.trim(),

      phone:
        this.form.phone.trim(),

      position:
        this.form.position.trim(),

      salary:
        Number(this.form.salary) || 0,

      joiningDate:
        this.form.joiningDate,

      status:
        this.form.status,

      departmentId:
        Number(this.form.departmentId)

    };

    this.employeeService
      .updateEmployee(employee);

    this.cancelForm();

  }

  toggleStatus(
    employee: Employee
  ): void {

    const updatedEmployee: Employee = {

      ...employee,

      status:
        employee.status === 'Active'
          ? 'Inactive'
          : 'Active'

    };

    this.employeeService
      .updateEmployee(
        updatedEmployee
      );

  }

  deleteEmployee(
    employee: Employee
  ): void {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${employee.name}?`
      );

    if (!confirmed) {

      return;

    }

    this.employeeService
      .deleteEmployee(
        employee.id
      );

  }

  cancelForm(): void {

    this.showForm = false;

    this.editingId = null;

    this.showPassword = false;

    this.showConfirmPassword = false;

    this.form =
      this.createEmptyForm();

  }

  private createEmptyForm(): EmployeeForm {

    return {

      name: '',

      email: '',

      phone: '',

      position: '',

      salary: 0,

      joiningDate:
        new Date()
          .toISOString()
          .substring(0, 10),

      status: 'Active',

      departmentId: 0,

      password: '',

      confirmPassword: ''

    };

  }

}