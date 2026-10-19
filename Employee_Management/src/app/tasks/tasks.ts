import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  TaskService,
  TaskItem,
  TaskStatus,
  TaskPriority
} from '../services/task.service';

import { EmployeeService } from '../services/employee';

import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css']
})
export class Tasks implements OnInit {

  // =========================================================
  // DATA
  // =========================================================

  tasks: TaskItem[] = [];

  visibleTasks: TaskItem[] = [];

  employees: any[] = [];

  // =========================================================
  // CURRENT USER
  // =========================================================

  currentUser: any = null;

  currentUserRole = '';

  currentEmployeeId: number | null = null;

  currentDepartmentId: number | null = null;

  canManage = false;

  // =========================================================
  // SEARCH / FILTER
  // =========================================================

  searchText = '';

  selectedStatus = 'All';

  selectedPriority = 'All';

  // =========================================================
  // FORM
  // =========================================================

  showForm = false;

  loading = false;

  saving = false;

  errorMessage = '';

  successMessage = '';

  editingId: number | null = null;

  formTitle = '';

  formDescription = '';

  formEmployeeId = 0;

  formPriority: TaskPriority = 'Medium';

  formDueDate = '';

  formStatus: TaskStatus = 'Pending';

  newTask: TaskItem = {
    title: '',
    description: '',
    assignedToEmployeeId: 0,
    assignedByEmployeeId: null,
    priority: 'Medium',
    status: 'Pending',
    dueDate: ''
  };

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private taskService: TaskService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadCurrentUser();

    this.loadEmployees();
  }

  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  loadCurrentUser(): void {

    try {

      const storedUser =
        localStorage.getItem('currentUser');

      if (!storedUser) {

        console.warn(
          'No currentUser found in localStorage.'
        );

        this.currentUser = null;

        this.currentUserRole = '';

        this.currentEmployeeId = null;

        this.currentDepartmentId = null;

        this.canManage = false;

        return;
      }

      this.currentUser =
        JSON.parse(storedUser);

      console.log(
        'Current user:',
        this.currentUser
      );

      // =====================================================
      // EMPLOYEE ID
      // =====================================================

      if (
        this.currentUser.employeeId !== null &&
        this.currentUser.employeeId !== undefined &&
        this.currentUser.employeeId !== ''
      ) {

        this.currentEmployeeId =
          Number(this.currentUser.employeeId);

      } else {

        this.currentEmployeeId = null;
      }

      // =====================================================
      // ROLE
      // =====================================================

      let role = '';

      if (
        Array.isArray(this.currentUser.roles) &&
        this.currentUser.roles.length > 0
      ) {

        role =
          this.currentUser.roles[0];

      } else if (
        this.currentUser.role
      ) {

        role =
          this.currentUser.role;
      }

      this.currentUserRole =
        String(role).toLowerCase().trim();

      // =====================================================
      // PERMISSION
      // =====================================================

      this.canManage =
        this.currentUserRole === 'admin' ||
        this.currentUserRole === 'manager';

      console.log(
        'Current role:',
        this.currentUserRole
      );

      console.log(
        'Current employee ID:',
        this.currentEmployeeId
      );

      console.log(
        'Can manage tasks:',
        this.canManage
      );

    } catch (error) {

      console.error(
        'Error reading current user:',
        error
      );

      this.currentUser = null;

      this.currentUserRole = '';

      this.currentEmployeeId = null;

      this.currentDepartmentId = null;

      this.canManage = false;
    }
  }

  // =========================================================
  // LOAD EMPLOYEES
  // =========================================================

  loadEmployees(): void {

    console.log(
      'Loading employees...'
    );

    this.employeeService
      .getEmployees()
      .subscribe({

        next: (employees) => {

          this.employees =
            employees || [];

          console.log(
            'Employees loaded:',
            this.employees
          );

          this.findCurrentEmployee();

          this.loadTasks();
        },

        error: (error) => {

          console.error(
            'Error loading employees:',
            error
          );

          this.employees = [];

          this.errorMessage =
            'Unable to load employees.';

          this.loadTasks();
        }
      });
  }

  // =========================================================
  // FIND CURRENT EMPLOYEE
  // =========================================================

  findCurrentEmployee(): void {

    this.currentDepartmentId = null;

    if (!this.currentEmployeeId) {

      console.warn(
        'Current user does not have EmployeeId.'
      );

      return;
    }

    const employee =
      this.employees.find(
        emp =>
          Number(emp.id) ===
          Number(this.currentEmployeeId)
      );

    if (!employee) {

      console.warn(
        'Current employee not found:',
        this.currentEmployeeId
      );

      return;
    }

    this.currentDepartmentId =
      employee.departmentId
        ? Number(employee.departmentId)
        : null;

    console.log(
      'Current employee:',
      employee
    );

    console.log(
      'Current department ID:',
      this.currentDepartmentId
    );
  }

  // =========================================================
  // LOAD TASKS
  // =========================================================

  loadTasks(): void {

    this.loading = true;

    this.errorMessage = '';

    console.log(
      '=============================='
    );

    console.log(
      'LOADING TASKS'
    );

    console.log(
      'Role:',
      this.currentUserRole
    );

    console.log(
      'Employee ID:',
      this.currentEmployeeId
    );

    console.log(
      'Department ID:',
      this.currentDepartmentId
    );

    console.log(
      '=============================='
    );

    // =====================================================
    // EMPLOYEE
    // =====================================================

    if (
      this.currentUserRole === 'employee'
    ) {

      if (!this.currentEmployeeId) {

        this.tasks = [];

        this.visibleTasks = [];

        this.loading = false;

        this.errorMessage =
          'Employee account is not linked to an employee profile.';

        this.cdr.detectChanges();

        return;
      }

      console.log(
        'Loading tasks for employee:',
        this.currentEmployeeId
      );

      this.taskService
        .getTasksByEmployee(
          this.currentEmployeeId
        )
        .subscribe({

          next: (tasks) => {

            console.log(
              'RAW EMPLOYEE TASK RESPONSE:',
              tasks
            );

            this.tasks =
              Array.isArray(tasks)
                ? [...tasks]
                : [];

            console.log(
              'Employee tasks loaded:',
              this.tasks
            );

            console.log(
              'Employee task count:',
              this.tasks.length
            );

            this.applyFilters();

            console.log(
              'Visible task count:',
              this.visibleTasks.length
            );

            this.loading = false;

            this.cdr.detectChanges();
          },

          error: (error) => {

            console.error(
              'Error loading employee tasks:',
              error
            );

            this.tasks = [];

            this.visibleTasks = [];

            this.loading = false;

            this.errorMessage =
              error?.error?.message ||
              'Unable to load your tasks.';

            this.cdr.detectChanges();
          }
        });

      return;
    }

    // =====================================================
    // ADMIN
    // =====================================================

    if (
      this.currentUserRole === 'admin'
    ) {

      console.log(
        'Admin: loading all tasks.'
      );

      this.taskService
        .getTasks()
        .subscribe({

          next: (tasks) => {

            this.tasks =
              Array.isArray(tasks)
                ? [...tasks]
                : [];

            console.log(
              'Admin tasks loaded:',
              this.tasks
            );

            this.applyFilters();

            this.loading = false;

            this.cdr.detectChanges();
          },

          error: (error) => {

            console.error(
              'Error loading admin tasks:',
              error
            );

            this.tasks = [];

            this.visibleTasks = [];

            this.loading = false;

            this.errorMessage =
              error?.error?.message ||
              'Unable to load tasks.';

            this.cdr.detectChanges();
          }
        });

      return;
    }

    // =====================================================
    // MANAGER
    // =====================================================

    if (
      this.currentUserRole === 'manager'
    ) {

      console.log(
        'Manager: loading department tasks.'
      );

      this.taskService
        .getTasks()
        .subscribe({

          next: (tasks) => {

            const allTasks =
              Array.isArray(tasks)
                ? [...tasks]
                : [];

            if (!this.currentDepartmentId) {

              console.warn(
                'Manager department not found.'
              );

              this.tasks = [];

            } else {

              this.tasks =
                allTasks.filter(task => {

                  const employee =
                    this.employees.find(
                      emp =>
                        Number(emp.id) ===
                        Number(task.assignedToEmployeeId)
                    );

                  return (
                    Number(employee?.departmentId) ===
                    Number(this.currentDepartmentId)
                  );
                });
            }

            console.log(
              'Manager department tasks:',
              this.tasks
            );

            this.applyFilters();

            this.loading = false;

            this.cdr.detectChanges();
          },

          error: (error) => {

            console.error(
              'Error loading manager tasks:',
              error
            );

            this.tasks = [];

            this.visibleTasks = [];

            this.loading = false;

            this.errorMessage =
              error?.error?.message ||
              'Unable to load department tasks.';

            this.cdr.detectChanges();
          }
        });

      return;
    }

    // =====================================================
    // UNKNOWN ROLE
    // =====================================================

    console.warn(
      'Unknown user role:',
      this.currentUserRole
    );

    this.tasks = [];

    this.visibleTasks = [];

    this.loading = false;

    this.errorMessage =
      'Unable to determine your user role.';

    this.cdr.detectChanges();
  }

  // =========================================================
  // APPLY FILTERS
  // =========================================================

  applyFilters(): void {

    let result =
      [...this.tasks];

    // =====================================================
    // SEARCH
    // =====================================================

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (search) {

      result =
        result.filter(task => {

          const employeeName =
            task.assignedToEmployee?.name ||
            this.getEmployeeName(
              task.assignedToEmployeeId
            );

          const department =
            this.getEmployeeDepartment(
              task.assignedToEmployeeId
            );

          return (

            task.title
              ?.toLowerCase()
              .includes(search)

            ||

            task.description
              ?.toLowerCase()
              .includes(search)

            ||

            employeeName
              .toLowerCase()
              .includes(search)

            ||

            department
              .toLowerCase()
              .includes(search)
          );
        });
    }

    // =====================================================
    // STATUS
    // =====================================================

    if (
      this.selectedStatus !== 'All'
    ) {

      result =
        result.filter(
          task =>
            task.status ===
            this.selectedStatus
        );
    }

    // =====================================================
    // PRIORITY
    // =====================================================

    if (
      this.selectedPriority !== 'All'
    ) {

      result =
        result.filter(
          task =>
            task.priority ===
            this.selectedPriority
        );
    }

    this.visibleTasks =
      [...result];

    console.log(
      'Filters applied.'
    );

    console.log(
      'Total tasks:',
      this.tasks.length
    );

    console.log(
      'Visible tasks:',
      this.visibleTasks.length
    );

    this.cdr.detectChanges();
  }

  // =========================================================
  // FILTER EVENTS
  // =========================================================

  onSearchChange(): void {

    this.applyFilters();
  }

  onStatusChange(): void {

    this.applyFilters();
  }

  onPriorityChange(): void {

    this.applyFilters();
  }

  // =========================================================
  // OPEN CREATE FORM
  // =========================================================

  openCreateForm(): void {

    if (!this.canManage) {

      this.errorMessage =
        'You do not have permission to assign tasks.';

      return;
    }

    this.resetForm();

    this.showForm = true;

    this.errorMessage = '';

    this.successMessage = '';
  }

  // =========================================================
  // CLOSE FORM
  // =========================================================

  closeForm(): void {

    this.showForm = false;

    this.resetForm();
  }

  // =========================================================
  // RESET FORM
  // =========================================================

  resetForm(): void {

    this.editingId = null;

    this.formTitle = '';

    this.formDescription = '';

    this.formEmployeeId = 0;

    this.formPriority = 'Medium';

    this.formDueDate = '';

    this.formStatus = 'Pending';

    this.newTask = {

      title: '',

      description: '',

      assignedToEmployeeId: 0,

      assignedByEmployeeId: null,

      priority: 'Medium',

      status: 'Pending',

      dueDate: ''
    };
  }

  // =========================================================
  // COUNTS
  // =========================================================

  get totalTasks(): number {

    return this.tasks.length;
  }

  get pendingCount(): number {

    return this.tasks.filter(
      task =>
        task.status === 'Pending'
    ).length;
  }

  get inProgressCount(): number {

    return this.tasks.filter(
      task =>
        task.status === 'In Progress'
    ).length;
  }

  get completedCount(): number {

    return this.tasks.filter(
      task =>
        task.status === 'Completed'
    ).length;
  }

  get overdueCount(): number {

    return this.tasks.filter(
      task =>
        this.isOverdue(task)
    ).length;
  }

  get localDateForInput(): string {

    return new Date()
      .toISOString()
      .split('T')[0];
  }

  // =========================================================
  // EDIT TASK
  // =========================================================

  editTask(task: TaskItem): void {

    if (!this.canManage) {

      this.errorMessage =
        'You do not have permission to edit tasks.';

      return;
    }

    this.editingId =
      task.id ?? null;

    this.formTitle =
      task.title;

    this.formDescription =
      task.description;

    this.formEmployeeId =
      task.assignedToEmployeeId;

    this.formPriority =
      task.priority;

    this.formDueDate =
      task.dueDate?.split('T')[0] || '';

    this.formStatus =
      task.status;

    this.showForm = true;
  }

  // =========================================================
  // SAVE TASK
  // =========================================================

  saveTask(): void {

    if (!this.canManage) {

      this.errorMessage =
        'You do not have permission to manage tasks.';

      return;
    }

    const title =
      this.formTitle.trim();

    const description =
      this.formDescription.trim();

    if (!title) {

      this.errorMessage =
        'Please enter task title.';

      return;
    }

    if (!description) {

      this.errorMessage =
        'Please enter task description.';

      return;
    }

    if (!this.formEmployeeId) {

      this.errorMessage =
        'Please select an employee.';

      return;
    }

    if (!this.formDueDate) {

      this.errorMessage =
        'Please select due date.';

      return;
    }

    // =====================================================
    // MANAGER DEPARTMENT VALIDATION
    // =====================================================

    if (
      this.currentUserRole === 'manager'
    ) {

      const selectedEmployee =
        this.employees.find(
          emp =>
            Number(emp.id) ===
            Number(this.formEmployeeId)
        );

      if (
        !selectedEmployee ||
        Number(selectedEmployee.departmentId) !==
        Number(this.currentDepartmentId)
      ) {

        this.errorMessage =
          'Managers can assign tasks only to employees in their own department.';

        return;
      }
    }

    const taskPayload: TaskItem = {

      title,

      description,

      assignedToEmployeeId:
        Number(this.formEmployeeId),

      assignedByEmployeeId:
        this.currentEmployeeId,

      priority:
        this.formPriority,

      status:
        this.formStatus,

      dueDate:
        this.formDueDate
    };

    // =====================================================
    // UPDATE
    // =====================================================

    if (this.editingId !== null) {

      this.saving = true;

      this.taskService
        .updateTask(
          this.editingId,
          {
            ...taskPayload,
            id: this.editingId
          }
        )
        .subscribe({

          next: () => {

            this.saving = false;

            this.successMessage =
              'Task updated successfully.';

            this.closeForm();

            this.loadTasks();

            setTimeout(() => {

              this.successMessage = '';

            }, 2500);
          },

          error: (error) => {

            this.saving = false;

            console.error(
              'Error updating task:',
              error
            );

            this.errorMessage =
              error?.error?.message ||
              'Unable to update task.';
          }
        });

      return;
    }

    // =====================================================
    // CREATE
    // =====================================================

    this.newTask =
      taskPayload;

    this.createTask();
  }

  // =========================================================
  // CREATE TASK
  // =========================================================

  createTask(): void {

    if (!this.canManage) {

      this.errorMessage =
        'You do not have permission to create tasks.';

      return;
    }

    this.errorMessage = '';

    this.successMessage = '';

    if (!this.newTask.title.trim()) {

      this.errorMessage =
        'Please enter task title.';

      return;
    }

    if (!this.newTask.description.trim()) {

      this.errorMessage =
        'Please enter task description.';

      return;
    }

    if (!this.newTask.assignedToEmployeeId) {

      this.errorMessage =
        'Please select an employee.';

      return;
    }

    if (!this.newTask.dueDate) {

      this.errorMessage =
        'Please select due date.';

      return;
    }

    // =====================================================
    // MANAGER DEPARTMENT VALIDATION
    // =====================================================

    if (
      this.currentUserRole === 'manager'
    ) {

      const selectedEmployee =
        this.employees.find(
          emp =>
            Number(emp.id) ===
            Number(this.newTask.assignedToEmployeeId)
        );

      if (
        !selectedEmployee ||
        Number(selectedEmployee.departmentId) !==
        Number(this.currentDepartmentId)
      ) {

        this.errorMessage =
          'Managers can assign tasks only to employees in their own department.';

        return;
      }
    }

    this.saving = true;

    const task: TaskItem = {

      title:
        this.newTask.title.trim(),

      description:
        this.newTask.description.trim(),

      assignedToEmployeeId:
        Number(
          this.newTask.assignedToEmployeeId
        ),

      assignedByEmployeeId:
        this.currentEmployeeId,

      priority:
        this.newTask.priority,

      status:
        this.newTask.status,

      dueDate:
        this.newTask.dueDate
    };

    console.log(
      'Sending task:',
      task
    );

    this.taskService
      .createTask(task)
      .subscribe({

        next: (createdTask) => {

          this.saving = false;

          console.log(
            'Task created:',
            createdTask
          );

          this.tasks.unshift(
            createdTask
          );

          this.applyFilters();

          // =================================================
          // NOTIFICATION
          // =================================================

          this.notificationService
            .addNotification(

              Number(
                createdTask.assignedToEmployeeId
              ),

              'New Task Assigned',

              `You have been assigned a new task: ${createdTask.title}`,

              'Task'
            )
            .subscribe({

              next: () => {

                console.log(
                  'Task notification created.'
                );
              },

              error: (notificationError) => {

                console.error(
                  'Notification error:',
                  notificationError
                );
              }
            });

          this.successMessage =
            'Task created successfully.';

          this.showForm = false;

          this.resetForm();

          this.cdr.detectChanges();

          setTimeout(() => {

            this.successMessage = '';

          }, 3000);
        },

        error: (error) => {

          this.saving = false;

          console.error(
            'Error creating task:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to create task. Please try again.';
        }
      });
  }

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  updateStatus(
    task: TaskItem,
    status: TaskStatus
  ): void {

    if (!task.id) {
      return;
    }

    const oldStatus =
      task.status;

    task.status =
      status;

    this.taskService
      .updateTaskStatus(
        task.id,
        status
      )
      .subscribe({

        next: () => {

          if (
            status === 'Completed'
          ) {

            task.completedAt =
              new Date().toISOString();

          } else {

            task.completedAt = null;
          }

          this.applyFilters();

          this.successMessage =
            'Task status updated successfully.';

          this.cdr.detectChanges();

          setTimeout(() => {

            this.successMessage = '';

          }, 2500);
        },

        error: (error) => {

          console.error(
            'Error updating status:',
            error
          );

          task.status =
            oldStatus;

          this.applyFilters();

          this.errorMessage =
            error?.error?.message ||
            'Unable to update task status.';
        }
      });
  }

  // =========================================================
  // DELETE TASK
  // =========================================================

  deleteTask(
    task: TaskItem
  ): void {

    if (!this.canManage) {

      this.errorMessage =
        'You do not have permission to delete tasks.';

      return;
    }

    if (!task.id) {
      return;
    }

    const confirmed =
      confirm(
        `Are you sure you want to delete "${task.title}"?`
      );

    if (!confirmed) {
      return;
    }

    this.taskService
      .deleteTask(task.id)
      .subscribe({

        next: () => {

          this.tasks =
            this.tasks.filter(
              t =>
                t.id !== task.id
            );

          this.applyFilters();

          this.successMessage =
            'Task deleted successfully.';

          this.cdr.detectChanges();

          setTimeout(() => {

            this.successMessage = '';

          }, 2500);
        },

        error: (error) => {

          console.error(
            'Error deleting task:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to delete task.';
        }
      });
  }

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  clearFilters(): void {

    this.searchText = '';

    this.selectedStatus = 'All';

    this.selectedPriority = 'All';

    this.applyFilters();
  }

  // =========================================================
  // EMPLOYEE NAME
  // =========================================================

  getEmployeeName(
    employeeId: number
  ): string {

    const employee =
      this.employees.find(
        employee =>
          Number(employee.id) ===
          Number(employeeId)
      );

    return (
      employee?.name ||
      'Unknown Employee'
    );
  }

  // =========================================================
  // EMPLOYEE DEPARTMENT
  // =========================================================

  getEmployeeDepartment(
    employeeId: number
  ): string {

    const employee =
      this.employees.find(
        employee =>
          Number(employee.id) ===
          Number(employeeId)
      );

    return (
      employee?.department?.name ||
      'No Department'
    );
  }

  // =========================================================
  // PRIORITY CLASS
  // =========================================================

  getPriorityClass(
    priority: TaskPriority
  ): string {

    switch (priority) {

      case 'High':
        return 'priority-high';

      case 'Medium':
        return 'priority-medium';

      case 'Low':
        return 'priority-low';

      default:
        return '';
    }
  }

  // =========================================================
  // STATUS CLASS
  // =========================================================

  getStatusClass(
    status: TaskStatus
  ): string {

    switch (status) {

      case 'Completed':
        return 'status-completed';

      case 'In Progress':
        return 'status-progress';

      case 'Pending':
        return 'status-pending';

      default:
        return '';
    }
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  formatDate(
    date: string | undefined
  ): string {

    if (!date) {
      return '-';
    }

    return new Date(
      date
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  }

  // =========================================================
  // CHECK OVERDUE
  // =========================================================

  isOverdue(
    task: TaskItem
  ): boolean {

    if (
      task.status === 'Completed' ||
      !task.dueDate
    ) {

      return false;
    }

    const today =
      new Date();

    const dueDate =
      new Date(
        task.dueDate
      );

    today.setHours(
      0,
      0,
      0,
      0
    );

    dueDate.setHours(
      0,
      0,
      0,
      0
    );

    return dueDate < today;
  }
}