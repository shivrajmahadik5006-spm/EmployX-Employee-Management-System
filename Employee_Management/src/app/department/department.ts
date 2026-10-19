import {
  CommonModule,
  CurrencyPipe
} from '@angular/common';

import {
  Component,
  OnInit
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Department as DepartmentModel,
  DepartmentForm,
  DepartmentService
} from '../services/department.service';

import {
  Employee,
  EmployeeService
} from '../services/employee';


@Component({
  selector: 'app-department',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe
  ],

  templateUrl: './department.html',
  styleUrl: './department.css'
})
export class Department implements OnInit {

  departments: DepartmentModel[] = [];

  // Employees available for manager selection
  managers: Employee[] = [];

  searchText = '';

  showForm = false;

  editingId: number | null = null;

  loading = false;

  form: DepartmentForm = this.createEmptyForm();


  constructor(
    private departmentService: DepartmentService,
    private employeeService: EmployeeService
  ) {}


  // =====================================
  // INITIALIZE
  // =====================================

  ngOnInit(): void {

    this.loadDepartments();

    this.loadManagers();

  }


  // =====================================
  // LOAD DEPARTMENTS
  // =====================================

  loadDepartments(): void {

    this.loading = true;

    this.departmentService
      .getDepartments()
      .subscribe({

        next: (departments) => {

          this.departments = departments;

          this.loading = false;

          console.log(
            'Departments loaded:',
            departments
          );

        },

        error: (error) => {

          this.loading = false;

          console.error(
            'Error loading departments:',
            error
          );

          alert(
            error.error?.message ||
            'Unable to load departments.'
          );

        }

      });

  }


  // =====================================
  // LOAD MANAGERS
  // =====================================

  loadManagers(): void {

    this.employeeService
      .getEmployees()
      .subscribe({

        next: (employees) => {

          /*
           * For now we allow employees to be selected
           * as department managers.
           *
           * Later, if you add a Role field to Employee,
           * we can filter only Manager users.
           */

          this.managers = employees.filter(
            employee =>
              employee.status?.toLowerCase() === 'active'
          );

          console.log(
            'Managers loaded:',
            this.managers
          );

        },

        error: (error) => {

          console.error(
            'Error loading managers:',
            error
          );

          alert(
            'Unable to load employees for manager selection.'
          );

        }

      });

  }


  // =====================================
  // SEARCH
  // =====================================

  get filteredDepartments():
    DepartmentModel[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (!search) {

      return this.departments;

    }

    return this.departments.filter(
      department =>

        department.name
          .toLowerCase()
          .includes(search)

        ||

        (department.manager || '')
          .toLowerCase()
          .includes(search)

    );

  }


  // =====================================
  // ADD FORM
  // =====================================

  openForm(): void {

    this.editingId = null;

    this.form =
      this.createEmptyForm();

    this.showForm = true;

  }


  // =====================================
  // EDIT FORM
  // =====================================

  editDepartment(
    department: DepartmentModel
  ): void {

    this.editingId =
      department.id;

    this.form = {

      name:
        department.name,

      manager:
        department.manager || '',

      budget:
        department.budget || 0

    };

    this.showForm = true;

  }


  // =====================================
  // SAVE DEPARTMENT
  // =====================================

  saveDepartment(): void {

    const name =
      this.form.name.trim();

    const manager =
      this.form.manager.trim();

    const budget =
      Number(this.form.budget) || 0;


    // NAME VALIDATION

    if (!name) {

      alert(
        'Please enter the department name.'
      );

      return;

    }


    // MANAGER VALIDATION

    if (!manager) {

      alert(
        'Please select a department manager.'
      );

      return;

    }


    // BUDGET VALIDATION

    if (budget < 0) {

      alert(
        'Budget cannot be negative.'
      );

      return;

    }


    const departmentData:
      DepartmentForm = {

        name: name,

        manager: manager,

        budget: budget

      };


    // =================================
    // ADD
    // =================================

    if (this.editingId === null) {

      this.departmentService
        .addDepartment(
          departmentData
        )
        .subscribe({

          next: (department) => {

            console.log(
              'Department added:',
              department
            );

            alert(
              'Department added successfully!'
            );

            this.cancelForm();

            this.loadDepartments();

          },

          error: (error) => {

            console.error(
              'Add department error:',
              error
            );

            alert(
              error.error?.message ||
              'Unable to add department.'
            );

          }

        });

      return;

    }


    // =================================
    // UPDATE
    // =================================

    this.departmentService
      .updateDepartment(
        this.editingId,
        departmentData
      )
      .subscribe({

        next: () => {

          console.log(
            'Department updated successfully.'
          );

          alert(
            'Department updated successfully!'
          );

          this.cancelForm();

          this.loadDepartments();

        },

        error: (error) => {

          console.error(
            'Update department error:',
            error
          );

          alert(
            error.error?.message ||
            'Unable to update department.'
          );

        }

      });

  }


  // =====================================
  // DELETE
  // =====================================

  deleteDepartment(
    id: number
  ): void {

    const department =
      this.departments.find(
        item =>
          item.id === id
      );


    if (!department) {

      return;

    }


    const employeeCount =
      department.employees?.length || 0;


    if (employeeCount > 0) {

      alert(
        'This department has employees. Reassign or remove the employees before deleting the department.'
      );

      return;

    }


    const confirmed =
      confirm(
        `Are you sure you want to delete "${department.name}"?`
      );


    if (!confirmed) {

      return;

    }


    this.departmentService
      .deleteDepartment(id)
      .subscribe({

        next: () => {

          alert(
            'Department deleted successfully!'
          );

          this.loadDepartments();

        },

        error: (error) => {

          console.error(
            'Delete department error:',
            error
          );

          alert(
            error.error?.message ||
            'Unable to delete department.'
          );

        }

      });

  }


  // =====================================
  // CANCEL FORM
  // =====================================

  cancelForm(): void {

    this.showForm = false;

    this.editingId = null;

    this.form =
      this.createEmptyForm();

  }


  // =====================================
  // EMPLOYEE COUNT
  // =====================================

  getEmployeeCount(
    department: DepartmentModel
  ): number {

    return (
      department.employees?.length || 0
    );

  }


  // =====================================
  // TOTAL EMPLOYEES
  // =====================================

  get totalEmployees(): number {

    return this.departments.reduce(
      (total, department) =>
        total +
        this.getEmployeeCount(department),
      0
    );

  }


  // =====================================
  // ACTIVE DEPARTMENTS
  // =====================================

  get activeDepartments(): number {

    return this.departments.length;

  }


  // =====================================
  // TOTAL BUDGET
  // =====================================

  get totalBudget(): number {

    return this.departments.reduce(
      (total, department) =>
        total +
        Number(department.budget || 0),
      0
    );

  }


  // =====================================
  // EMPTY FORM
  // =====================================

  private createEmptyForm():
    DepartmentForm {

    return {

      name: '',

      manager: '',

      budget: 0

    };

  }

}