import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TaskStatus =
  | 'Pending'
  | 'In Progress'
  | 'Completed';

export type TaskPriority =
  | 'Low'
  | 'Medium'
  | 'High';

export interface TaskEmployee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  position?: string;

  department?: {
    id: number;
    name: string;
  } | null;
}

export interface TaskItem {
  id?: number;

  title: string;

  description: string;

  assignedToEmployeeId: number;

  assignedByEmployeeId: number | null;

  priority: TaskPriority;

  status: TaskStatus;

  dueDate: string;

  createdAt?: string;

  completedAt?: string | null;

  assignedToEmployee?: TaskEmployee | null;

  assignedByEmployee?: TaskEmployee | null;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  /*
   * IMPORTANT
   * Task API is running on HTTPS port 7246.
   */
  private readonly apiUrl =
    'https://localhost:7246/api/Tasks';

  constructor(
    private http: HttpClient
  ) {}

  // =========================================================
  // GET ALL TASKS
  // =========================================================

  getTasks(): Observable<TaskItem[]> {

    return this.http.get<TaskItem[]>(
      this.apiUrl
    );
  }

  // =========================================================
  // GET ONE TASK
  // =========================================================

  getTask(
    id: number
  ): Observable<TaskItem> {

    return this.http.get<TaskItem>(
      `${this.apiUrl}/${id}`
    );
  }

  // =========================================================
  // GET TASKS FOR ONE EMPLOYEE
  // =========================================================

  getTasksByEmployee(
    employeeId: number
  ): Observable<TaskItem[]> {

    return this.http.get<TaskItem[]>(
      `${this.apiUrl}/employee/${employeeId}`
    );
  }

  // =========================================================
  // CREATE TASK
  // =========================================================

  createTask(
    task: TaskItem
  ): Observable<TaskItem> {

    return this.http.post<TaskItem>(
      this.apiUrl,
      task
    );
  }

  // =========================================================
  // UPDATE TASK
  // =========================================================

  updateTask(
    id: number,
    task: TaskItem
  ): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      task
    );
  }

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  updateTaskStatus(
    id: number,
    status: TaskStatus
  ): Observable<any> {

    const request: UpdateTaskStatusRequest = {
      status: status
    };

    return this.http.put<any>(
      `${this.apiUrl}/${id}/status`,
      request
    );
  }

  // =========================================================
  // DELETE TASK
  // =========================================================

  deleteTask(
    id: number
  ): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );
  }
}