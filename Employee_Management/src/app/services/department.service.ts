import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Department {
  id: number;
  name: string;
  manager: string;
  budget: number;
  employees?: DepartmentEmployee[];
}

export interface DepartmentEmployee {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  joiningDate: string;
  status: string;
  departmentId: number;
}

export interface DepartmentForm {
  name: string;
  manager: string;
  budget: number;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  private apiUrl =
    'https://localhost:7246/api/Departments';

  constructor(
    private http: HttpClient
  ) {}

  getDepartments():
    Observable<Department[]> {

    return this.http.get<Department[]>(
      this.apiUrl
    );
  }

  getDepartment(
    id: number
  ): Observable<Department> {

    return this.http.get<Department>(
      `${this.apiUrl}/${id}`
    );
  }

  addDepartment(
    department: DepartmentForm
  ): Observable<Department> {

    return this.http.post<Department>(
      this.apiUrl,
      department
    );
  }

  updateDepartment(
    id: number,
    department: DepartmentForm
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      department
    );
  }

  deleteDepartment(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}